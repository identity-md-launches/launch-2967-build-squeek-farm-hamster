export const API_URL = 'https://api.squeekchain.com/v1/status';
export const API_DOCS = 'https://docs.squeekchain.com/developers/api/';
export type Wheel = { status: 'checking' | 'spinning' | 'resting' | 'offline'; rpm: number | null; checkedAt: number; expiresAt: number; reason: string };
export const OFFLINE: Wheel = { status: 'offline', rpm: null, checkedAt: 0, expiresAt: 0, reason: 'Live wheel data is unavailable. Farming continues at normal speed.' };
type RecordValue = Record<string, unknown>;
const obj = (v: unknown): RecordValue | null => v !== null && typeof v === 'object' ? v as RecordValue : null;
export function parseWheel(data: unknown, now: number): Wheel {
  const d = obj(data), m = obj(d?.measurement), oracle = obj(d?.oracle);
  if (!d || d.schemaVersion !== 1 || d.status === 'unavailable' || !m || m.freshness !== 'online'
    || m.provenance !== 'hardware' || oracle?.state !== 'accepted'
    || !['IDLE', 'ACTIVE'].includes(String(m.coreStatus)) || !Number.isSafeInteger(m.rpmMilli) || (m.rpmMilli as number) < 0
    || !Number.isSafeInteger(m.speedMmPerSecond) || (m.speedMmPerSecond as number) < 0) return { ...OFFLINE, checkedAt: now };
  const observed = Date.parse(String(m.observedAt));
  const received = Date.parse(String(m.receivedAt));
  const generated = Date.parse(String(d.generatedAt));
  const staleAfter = Math.min(120, Number(m.staleAfterSeconds));
  if (!Number.isFinite(staleAfter) || staleAfter <= 0 || ![observed, received, generated].every(Number.isFinite)
    || [observed, received, generated].some(t => t > now + 5000 || now - t > staleAfter * 1000)) {
    return { ...OFFLINE, checkedAt: now, reason: 'The wheel reading is stale. Farming continues at normal speed.' };
  }
  const spinning = m.coreStatus === 'ACTIVE' && (m.rpmMilli as number) > 0 && (m.speedMmPerSecond as number) > 0;
  return { status: spinning ? 'spinning' : 'resting', rpm: (m.rpmMilli as number) / 1000, checkedAt: now,
    expiresAt: Math.min(observed, received, generated) + staleAfter * 1000,
    reason: spinning ? 'Fresh, accepted hardware data. Squeek Sunshine gives 10% faster growth while this farm is active.' : 'The real hamster wheel is resting. Your crops grow at normal speed.' };
}
export async function fetchWheel(signal?: AbortSignal): Promise<Wheel> {
  try {
    const response = await fetch(API_URL, { signal, cache: 'no-cache', credentials: 'omit' });
    if (!response.ok) return { ...OFFLINE, checkedAt: Date.now() };
    return parseWheel(await response.json(), Date.now());
  } catch { return { ...OFFLINE, checkedAt: Date.now() }; }
}
