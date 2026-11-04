export const SAVE_KEY = 'squeek-farm-v1';
export const CROP_IDS = ['sunflower', 'carrot', 'strawberry', 'corn', 'pumpkin', 'grapes'] as const;
export type CropId = typeof CROP_IDS[number];
export const CROPS: Record<CropId, { name: string; seconds: number; quantity: number; price: number; unlock: number; color: string }> = {
  sunflower: { name: 'Sunflower', seconds: 30, quantity: 8, price: 2, unlock: 0, color: '#f5c844' },
  carrot: { name: 'Carrot', seconds: 45, quantity: 10, price: 3, unlock: 0, color: '#f49b45' },
  strawberry: { name: 'Strawberry', seconds: 60, quantity: 10, price: 4, unlock: 100, color: '#ee7d82' },
  corn: { name: 'Corn', seconds: 90, quantity: 12, price: 5, unlock: 220, color: '#f5d46a' },
  pumpkin: { name: 'Pumpkin', seconds: 120, quantity: 12, price: 7, unlock: 450, color: '#eaa164' },
  grapes: { name: 'Grapes', seconds: 150, quantity: 12, price: 9, unlock: 750, color: '#b19ada' },
};
export const PLOT_POS = [
  [410, 365], [580, 365], [410, 525], [580, 525],
  [750, 365], [750, 525], [920, 365], [920, 525],
] as const;
export const DEFENSES = [
  { name: 'Seed Slingshot', cost: 60, range: 190, cooldown: 1100, damage: 1, x: 1035, y: 430, description: 'A little twang. A big surprise.', rangeName: 'Short range' },
  { name: 'Hamster Guard Tower', cost: 160, range: 285, cooldown: 1300, damage: 2, x: 820, y: 675, description: 'An extra pair of very watchful cheeks.', rangeName: 'Medium range' },
  { name: 'Sunflower Cannon', cost: 350, range: 440, cooldown: 1700, damage: 3, x: 420, y: 675, description: 'Soft seeds. Firm boundaries.', rangeName: 'Long range' },
] as const;
export type Plot = { crop: CropId; plantedAt: number; id: number; growth: number; lost: number } | null;
export type Bandit = {
  target: number; plantingId: number; phase: 'warning' | 'approach' | 'steal' | 'escape' | 'repelled';
  x: number; y: number; elapsed: number; hp: number; loot: number; cooldowns: number[];
};
export type Game = {
  version: 1; started: boolean; lastAt: number; activeMs: number; nextRaidAt: number; sequence: number;
  plots: Plot[]; plotCount: number; inventory: Record<CropId, number>; unlocked: CropId[];
  balance: number; minted: number; burned: number; treasury: number; defenses: boolean[];
  bandit: Bandit | null; harvested: number; sold: number; repelled: number; stolen: number;
  tutorial: number; sound: boolean; message: string; eventId: number;
  effect: { kind: 'plant' | 'harvest' | 'sale' | 'expand' | 'defense' | 'shot' | 'retreat' | 'theft'; plot?: number; weapon?: number; amount?: number } | null;
};
export type Action =
  | { type: 'TICK'; now: number; active: boolean; sunshine: boolean; random?: number }
  | { type: 'START'; now: number }
  | { type: 'PLANT'; plot: number; crop: CropId; now: number }
  | { type: 'HARVEST'; plot: number; now: number }
  | { type: 'HARVEST_ALL'; now: number }
  | { type: 'SELL'; crop?: CropId; quantity?: number }
  | { type: 'UNLOCK'; crop: CropId }
  | { type: 'EXPAND' }
  | { type: 'DEFENSE'; slot: number }
  | { type: 'TUTORIAL' }
  | { type: 'SOUND' };
export function newGame(now = Date.now()): Game {
  return {
    version: 1, started: false, lastAt: now, activeMs: 0, nextRaidAt: 90_000, sequence: 0,
    plots: Array<Plot>(8).fill(null), plotCount: 4,
    inventory: Object.fromEntries(CROP_IDS.map(id => [id, 0])) as Record<CropId, number>,
    unlocked: ['sunflower', 'carrot'], balance: 0, minted: 0, burned: 0, treasury: 0,
    defenses: [false, false, false], bandit: null, harvested: 0, sold: 0, repelled: 0, stolen: 0,
    tutorial: 0, sound: false, message: 'A little patch of possibility. Let’s plant!', eventId: 0, effect: null,
  };
}
const int = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
export function validGame(g: unknown): g is Game {
  if (!g || typeof g !== 'object') return false;
  const s = g as Game;
  return s.version === 1 && typeof s.started === 'boolean' && typeof s.sound === 'boolean' && typeof s.message === 'string'
    && [s.lastAt, s.activeMs, s.nextRaidAt, s.sequence, s.balance, s.minted, s.burned, s.treasury,
      s.harvested, s.sold, s.repelled, s.stolen, s.tutorial, s.eventId].every(int)
    && s.minted === s.balance + s.burned + s.treasury && s.tutorial <= 4
    && [4, 6, 8].includes(s.plotCount) && Array.isArray(s.plots) && s.plots.length === 8
    && s.plots.every((p, i) => p === null || (i < s.plotCount && CROP_IDS.includes(p.crop) && int(p.plantedAt) && int(p.id)
      && int(p.growth) && p.growth <= CROPS[p.crop].seconds * 1000 && int(p.lost) && p.lost <= CROPS[p.crop].quantity))
    && s.inventory != null && CROP_IDS.every(id => int(s.inventory[id]))
    && Array.isArray(s.unlocked) && s.unlocked.includes('sunflower') && s.unlocked.includes('carrot')
    && s.unlocked.every(id => CROP_IDS.includes(id))
    && Array.isArray(s.defenses) && s.defenses.length === 3 && s.defenses.every(d => typeof d === 'boolean');
}
export function restore(raw: string | null, now: number): { game: Game; recovered: boolean } {
  if (!raw) return { game: newGame(now), recovered: false };
  try {
    const candidate: unknown = JSON.parse(raw);
    if (!validGame(candidate)) throw new Error('Invalid save');
    // An interrupted raid never resolves offline. Growth continues at the base rate only.
    return { game: { ...advanceGrowth(candidate, now, 0), bandit: null, effect: null }, recovered: false };
  } catch { return { game: newGame(now), recovered: true }; }
}
export function mature(p: Plot): boolean { return p !== null && p.growth >= CROPS[p.crop].seconds * 1000; }
export function remaining(p: Plot): number { return p ? Math.max(0, Math.ceil((CROPS[p.crop].seconds * 1000 - p.growth) / 1000)) : 0; }
export function inventoryValue(g: Game): number { return CROP_IDS.reduce((n, id) => n + g.inventory[id] * CROPS[id].price, 0); }
export function inventoryCount(g: Game): number { return CROP_IDS.reduce((n, id) => n + g.inventory[id], 0); }
function emit(g: Game, message: string, effect: Game['effect'] = null): Game {
  return { ...g, message, effect, eventId: g.eventId + 1 };
}
function advanceGrowth(g: Game, now: number, bonusMs: number): Game {
  const elapsed = Math.max(0, Math.floor(now - g.lastAt));
  return { ...g, lastAt: Math.max(g.lastAt, Math.floor(now)), plots: g.plots.map(p => p ? {
    ...p, growth: Math.min(CROPS[p.crop].seconds * 1000, p.growth + elapsed + bonusMs),
  } : null) };
}
function purchase(g: Game, cost: number): Game | null {
  if (!int(cost) || cost === 0 || g.balance < cost) return null;
  return { ...g, balance: g.balance - cost, burned: g.burned + cost * 4 / 5, treasury: g.treasury + cost / 5 };
}
function harvest(g: Game, plot: number): Game {
  const p = g.plots[plot];
  if (plot >= g.plotCount || !p || !mature(p)) return g;
  const quantity = Math.max(0, CROPS[p.crop].quantity - p.lost);
  return emit({ ...g, plots: g.plots.map((v, i) => i === plot ? null : v),
    inventory: { ...g.inventory, [p.crop]: g.inventory[p.crop] + quantity }, harvested: g.harvested + quantity,
    tutorial: Math.max(g.tutorial, 2),
  }, `Fresh from the field! +${quantity} ${CROPS[p.crop].name.toLowerCase()} in your basket.`, { kind: 'harvest', plot, amount: quantity });
}
function tick(g: Game, action: Extract<Action, { type: 'TICK' }>): Game {
  // A stalled/backgrounded frame cannot count as active play or award live bonus.
  const elapsed = Math.max(0, Math.floor(action.now - g.lastAt));
  const dt = action.active && g.started && elapsed <= 2000 ? elapsed : 0;
  let s = advanceGrowth(g, action.now, action.sunshine ? Math.floor(dt / 10) : 0);
  s = { ...s, activeMs: s.activeMs + dt };
  if (dt === 0) return s.bandit ? { ...s, bandit: null } : s;
  if (!s.bandit && s.activeMs >= s.nextRaidAt) {
    const targets = s.plots.map((p, i) => mature(p) && p && p.lost < CROPS[p.crop].quantity ? i : -1).filter(i => i !== -1);
    if (targets.length) {
      const rnd = Math.max(0, Math.min(0.999999, action.random ?? Math.random()));
      const target = targets[Math.floor(rnd * targets.length)];
      s = emit({ ...s, nextRaidAt: s.activeMs + 90_000 + Math.floor(rnd * 60_000),
        bandit: { target, plantingId: s.plots[target]!.id, phase: 'warning', x: 1150, y: 485, elapsed: 0, hp: 3, loot: 0, cooldowns: [0, 0, 0] },
      }, 'Brutus is sneaking in! Harvest ripe crops or let your defenses handle him.');
    }
    return s;
  }
  if (!s.bandit) return s;
  const b: Bandit = { ...s.bandit, cooldowns: [...s.bandit.cooldowns], elapsed: s.bandit.elapsed + dt };
  const target = PLOT_POS[b.target];
  const p = s.plots[b.target];
  const targetExists = p && p.id === b.plantingId && mature(p);
  if (!targetExists && b.phase !== 'repelled') {
    b.phase = 'repelled'; b.elapsed = 0; b.loot = 0;
    s = emit(s, 'Too slow, Brutus! Those crops are already safe.', { kind: 'retreat' });
  }
  if (b.phase === 'warning') {
    if (b.elapsed >= 4000) { b.phase = 'approach'; b.elapsed = 0; }
  } else if (b.phase === 'approach') {
    const distance = Math.hypot(target[0] - b.x, target[1] - b.y);
    const move = 95 * dt / 1000;
    if (distance <= move + 20) { b.x = target[0]; b.y = target[1]; b.phase = 'steal'; b.elapsed = 0; }
    else { b.x += (target[0] - b.x) / distance * move; b.y += (target[1] - b.y) / distance * move; }
  } else if (b.phase === 'steal') {
    if (b.elapsed >= 2400) { b.loot = targetExists ? Math.min(4, CROPS[p.crop].quantity - p.lost) : 0; b.phase = 'escape'; b.elapsed = 0; }
  } else {
    b.x += (b.phase === 'repelled' ? 230 : 135) * dt / 1000;
    if (b.x >= 1200) {
      if (b.phase === 'escape' && targetExists && b.loot > 0) {
        const stolen = Math.min(b.loot, CROPS[p.crop].quantity - p.lost);
        return emit({ ...s, bandit: null, stolen: s.stolen + stolen,
          plots: s.plots.map((q, i) => i === b.target && q ? { ...q, lost: q.lost + stolen } : q),
        }, `Brutus escaped with ${stolen} ${CROPS[p.crop].name.toLowerCase()}. Your basket and GOLD are safe.`, { kind: 'theft', plot: b.target, amount: stolen });
      }
      return { ...s, bandit: null };
    }
  }
  if (b.phase !== 'repelled' && b.phase !== 'warning') {
    for (let i = 0; i < DEFENSES.length; i++) {
      b.cooldowns[i] = Math.max(0, b.cooldowns[i] - dt);
      const d = DEFENSES[i];
      if (s.defenses[i] && b.cooldowns[i] === 0 && Math.hypot(d.x - b.x, d.y - b.y) <= d.range) {
        b.hp -= d.damage; b.cooldowns[i] = d.cooldown;
        s = emit(s, `${d.name} fired a soft seed!`, { kind: 'shot', weapon: i });
        if (b.hp <= 0) {
          b.phase = 'repelled'; b.elapsed = 0; b.loot = 0;
          s = emit({ ...s, repelled: s.repelled + 1 }, 'Brutus: “I’m allergic to good security!” No crops lost.', { kind: 'retreat', weapon: i });
          break;
        }
      }
    }
  }
  return { ...s, bandit: b };
}
export function reduceGame(g: Game, action: Action): Game {
  switch (action.type) {
    case 'TICK': return tick(g, action);
    case 'START': return { ...g, started: true, lastAt: action.now };
    case 'PLANT': {
      if (!g.started || !int(action.plot) || action.plot >= g.plotCount || g.plots[action.plot] || !g.unlocked.includes(action.crop)) return g;
      const s = advanceGrowth(g, action.now, 0);
      return emit({ ...s, sequence: s.sequence + 1, tutorial: Math.max(s.tutorial, 1), plots: s.plots.map((p, i) => i === action.plot ? {
        crop: action.crop, id: s.sequence + 1, plantedAt: action.now, growth: 0, lost: 0,
      } : p) }, `${CROPS[action.crop].name} planted. A little sunshine does wonders.`, { kind: 'plant', plot: action.plot });
    }
    case 'HARVEST': return int(action.plot) ? harvest(advanceGrowth(g, action.now, 0), action.plot) : g;
    case 'HARVEST_ALL': {
      let s = advanceGrowth(g, action.now, 0);
      for (let i = 0; i < s.plotCount; i++) s = harvest(s, i);
      return s;
    }
    case 'SELL': {
      const ids = action.crop ? [action.crop] : CROP_IDS;
      if (action.crop && !CROP_IDS.includes(action.crop)) return g;
      let value = 0, count = 0;
      const inventory = { ...g.inventory };
      for (const id of ids) {
        const quantity = action.quantity ?? inventory[id];
        if (!int(quantity) || quantity > inventory[id]) return g;
        value += quantity * CROPS[id].price; count += quantity; inventory[id] -= quantity;
      }
      if (value === 0 || !Number.isSafeInteger(g.minted + value)) return g;
      return emit({ ...g, inventory, balance: g.balance + value, minted: g.minted + value, sold: g.sold + count,
        tutorial: Math.max(g.tutorial, 3) }, `Market day! +${value} GOLD from ${count} freshly grown goods.`, { kind: 'sale', amount: value });
    }
    case 'UNLOCK': {
      if (!CROP_IDS.includes(action.crop) || g.unlocked.includes(action.crop)) return g;
      const s = purchase(g, CROPS[action.crop].unlock);
      return s ? emit({ ...s, unlocked: [...s.unlocked, action.crop] }, `${CROPS[action.crop].name} seeds unlocked. Plant as often as you like!`, { kind: 'expand' }) : g;
    }
    case 'EXPAND': {
      if (g.plotCount === 8) return g;
      const s = purchase(g, g.plotCount === 4 ? 100 : 250);
      return s ? emit({ ...s, plotCount: s.plotCount + 2 }, 'Room to grow! Two new plots are ready for planting.', { kind: 'expand' }) : g;
    }
    case 'DEFENSE': {
      if (!int(action.slot) || action.slot > 2 || g.defenses[action.slot]) return g;
      const s = purchase(g, DEFENSES[action.slot].cost);
      return s ? emit({ ...s, defenses: s.defenses.map((v, i) => i === action.slot ? true : v) }, `${DEFENSES[action.slot].name} is on duty. Brutus, you’ve been warned.`, { kind: 'defense', weapon: action.slot }) : g;
    }
    case 'TUTORIAL': return { ...g, tutorial: 4 };
    case 'SOUND': return { ...g, sound: !g.sound };
  }
}
