import { describe, expect, it } from 'vitest';
import { CROP_IDS, CROPS, DEFENSES, inventoryValue, mature, newGame, reduceGame, restore, validGame, type CropId, type Game } from '../src/game';
import { parseWheel } from '../src/chain';

const start = () => reduceGame(newGame(1_000_000), { type: 'START', now: 1_000_000 });
function step(g: Game, ms: number, active = true, sunshine = false): Game {
  let s = g;
  for (let elapsed = 0; elapsed < ms; elapsed += 250) s = reduceGame(s, { type: 'TICK', now: s.lastAt + Math.min(250, ms - elapsed), active, sunshine, random: .25 });
  return s;
}
function grow(g: Game, crop: CropId, plot = 0): Game {
  const planted = reduceGame(g, { type: 'PLANT', plot, crop, now: g.lastAt });
  return step(planted, CROPS[crop].seconds * 1000, false);
}
function earn(g: Game, rounds = 1): Game {
  let s = g;
  for (let i = 0; i < rounds; i++) {
    s = grow(s, 'sunflower');
    s = reduceGame(s, { type: 'HARVEST', plot: 0, now: s.lastAt });
    s = reduceGame(s, { type: 'SELL' });
  }
  return s;
}
function funded(): Game { return earn(start(), 200); }
function raid(g: Game): Game {
  let s = grow(g, 'sunflower');
  s = { ...s, activeMs: 90_000, nextRaidAt: 90_000 };
  return step(s, 250);
}
const invariant = (g: Game) => {
  expect(g.minted).toBe(g.balance + g.treasury + g.burned);
  expect(validGame(g)).toBe(true);
  for (const value of Object.values(g.inventory)) expect(value).toBeGreaterThanOrEqual(0);
};

describe('six crops and atomic harvests', () => {
  for (const id of CROP_IDS) it(`${id}: exact duration, yield and sale price`, () => {
    let g = funded();
    if (!g.unlocked.includes(id)) g = reduceGame(g, { type: 'UNLOCK', crop: id });
    g = reduceGame(g, { type: 'PLANT', plot: 0, crop: id, now: g.lastAt });
    expect(g.plots[0]?.growth).toBe(0);
    g = step(g, CROPS[id].seconds * 1000 - 1, false);
    expect(mature(g.plots[0])).toBe(false);
    expect(reduceGame(g, { type: 'HARVEST', plot: 0, now: g.lastAt }).inventory[id]).toBe(0);
    g = step(g, 1, false);
    expect(mature(g.plots[0])).toBe(true);
    g = reduceGame(g, { type: 'HARVEST', plot: 0, now: g.lastAt });
    expect(g.inventory[id]).toBe(CROPS[id].quantity);
    expect(reduceGame(g, { type: 'HARVEST', plot: 0, now: g.lastAt }).inventory).toEqual(g.inventory);
    const old = g.balance;
    g = reduceGame(g, { type: 'SELL', crop: id });
    expect(g.balance - old).toBe(CROPS[id].quantity * CROPS[id].price);
    expect(g.inventory[id]).toBe(0); invariant(g);
  });
  it('rejects locked seeds, occupied plots and locked farmland', () => {
    const g = start();
    expect(reduceGame(g, { type: 'PLANT', plot: 0, crop: 'grapes', now: g.lastAt })).toBe(g);
    expect(reduceGame(g, { type: 'PLANT', plot: 4, crop: 'carrot', now: g.lastAt })).toBe(g);
    const planted = grow(g, 'carrot');
    expect(reduceGame(planted, { type: 'PLANT', plot: 0, crop: 'sunflower', now: g.lastAt })).toBe(planted);
  });
  it('harvest-all is repeat-safe and excludes growing plants', () => {
    let g = grow(start(), 'sunflower');
    g = reduceGame(g, { type: 'PLANT', plot: 1, crop: 'carrot', now: g.lastAt });
    g = reduceGame(g, { type: 'HARVEST_ALL', now: g.lastAt });
    expect(g.inventory.sunflower).toBe(8); expect(g.inventory.carrot).toBe(0);
    expect(reduceGame(g, { type: 'HARVEST_ALL', now: g.lastAt }).inventory).toEqual(g.inventory);
  });
});
describe('market and balanced integer GOLD ledger', () => {
  it('sells one unit, then the rest; duplicate/oversized/negative sales do nothing', () => {
    let g = grow(start(), 'carrot');
    g = reduceGame(g, { type: 'HARVEST', plot: 0, now: g.lastAt });
    expect(inventoryValue(g)).toBe(30);
    g = reduceGame(g, { type: 'SELL', crop: 'carrot', quantity: 1 });
    expect(g.balance).toBe(3); expect(g.inventory.carrot).toBe(9);
    for (const quantity of [-1, .5, 10, NaN, Infinity]) expect(reduceGame(g, { type: 'SELL', crop: 'carrot', quantity })).toBe(g);
    g = reduceGame(g, { type: 'SELL' }); expect(g.balance).toBe(30);
    expect(reduceGame(g, { type: 'SELL' })).toBe(g); invariant(g);
  });
  it('all seed unlocks and both expansions burn exactly 80% and retain 20%', () => {
    let g = funded(); const initialBalance = g.balance;
    let costs = 0;
    for (const crop of CROP_IDS.slice(2)) { costs += CROPS[crop].unlock; g = reduceGame(g, { type: 'UNLOCK', crop }); invariant(g); }
    g = reduceGame(g, { type: 'EXPAND' }); expect(g.plotCount).toBe(6); costs += 100;
    g = reduceGame(g, { type: 'EXPAND' }); expect(g.plotCount).toBe(8); costs += 250;
    expect(reduceGame(g, { type: 'EXPAND' })).toBe(g);
    expect(g.balance).toBe(initialBalance - costs); expect(g.burned).toBe(costs * .8); expect(g.treasury).toBe(costs * .2); invariant(g);
  });
  it('rejects unaffordable and duplicate purchases', () => {
    const poor = start();
    expect(reduceGame(poor, { type: 'UNLOCK', crop: 'strawberry' })).toBe(poor);
    expect(reduceGame(poor, { type: 'EXPAND' })).toBe(poor);
    expect(reduceGame(poor, { type: 'DEFENSE', slot: 0 })).toBe(poor);
    const rich = reduceGame(funded(), { type: 'DEFENSE', slot: 0 });
    expect(reduceGame(rich, { type: 'DEFENSE', slot: 0 })).toBe(rich);
    expect(reduceGame(rich, { type: 'UNLOCK', crop: 'carrot' })).toBe(rich);
    for (const slot of [-1, 3, .5]) expect(reduceGame(rich, { type: 'DEFENSE', slot })).toBe(rich);
    invariant(rich);
  });
});
describe('Brutus and automatic range/cooldown defenses', () => {
  it('keeps 90 seconds of beginner protection and never spawns without ripe crops', () => {
    let g = grow(start(), 'sunflower');
    g = step(g, 89_500); expect(g.bandit).toBeNull();
    g = step(g, 500); expect(g.bandit?.phase).toBe('warning');
    const empty = step(start(), 240_000); expect(empty.bandit).toBeNull();
  });
  it('steals at most four on escape, never on approach or sack pickup', () => {
    let g = raid(start());
    expect(g.bandit?.phase).toBe('warning'); expect(g.plots[0]?.lost).toBe(0);
    g = step(g, 15_000); expect(g.plots[0]?.lost).toBe(0);
    const cash = g.balance, stock = { ...g.inventory };
    g = step(g, 20_000); expect(g.bandit).toBeNull(); expect(g.plots[0]?.lost).toBe(4);
    expect(g.balance).toBe(cash); expect(g.inventory).toEqual(stock);
    g = reduceGame(g, { type: 'HARVEST', plot: 0, now: g.lastAt }); expect(g.inventory.sunflower).toBe(4); invariant(g);
  });
  it('harvesting a targeted crop saves it, including during escape', () => {
    let g = raid(start());
    while (g.bandit?.phase !== 'escape') g = step(g, 250);
    g = reduceGame(g, { type: 'HARVEST', plot: 0, now: g.lastAt });
    g = step(g, 20_000); expect(g.inventory.sunflower).toBe(8); expect(g.stolen).toBe(0);
  });
  for (let i = 0; i < DEFENSES.length; i++) it(`${DEFENSES[i].name} automatically intercepts within its range`, () => {
    let g = reduceGame(funded(), { type: 'DEFENSE', slot: i });
    expect(g.defenses[i]).toBe(true); expect(g.burned).toBe(DEFENSES[i].cost * .8);
    g = raid(g); g = step(g, 35_000);
    expect(g.repelled).toBe(1); expect(g.stolen).toBe(0); expect(g.plots[0]?.lost).toBe(0); invariant(g);
  });
  it('does not fire outside range and respects cooldown', () => {
    let g = reduceGame(funded(), { type: 'DEFENSE', slot: 0 }); g = raid(g);
    g = { ...g, bandit: { ...g.bandit!, phase: 'steal', elapsed: 0, x: 410, y: 365 } };
    g = step(g, 250); expect(g.bandit?.hp).toBe(3);
    g = { ...g, bandit: { ...g.bandit!, x: 1030, y: 430 } };
    g = step(g, 250); expect(g.bandit?.hp).toBe(2);
    g = step(g, 750); expect(g.bandit?.hp).toBe(2);
    g = step(g, 500); expect(g.bandit?.hp).toBe(1);
  });
  it('never produces negative yields across repeated raids', () => {
    let g = raid(start()); g = step(g, 40_000);
    g = { ...g, nextRaidAt: g.activeMs }; g = step(g, 40_000);
    expect(g.plots[0]?.lost).toBe(8);
    g = { ...g, nextRaidAt: g.activeMs }; g = step(g, 40_000);
    expect(g.bandit).toBeNull();
    g = reduceGame(g, { type: 'HARVEST', plot: 0, now: g.lastAt }); expect(g.inventory.sunflower).toBe(0); invariant(g);
  });
});
describe('saving and time accounting', () => {
  it('restores inventory, ledger, unlocks, expansions, defenses and timestamps', () => {
    let g = funded(); g = reduceGame(g, { type: 'UNLOCK', crop: 'grapes' });
    g = reduceGame(g, { type: 'EXPAND' }); g = reduceGame(g, { type: 'DEFENSE', slot: 1 });
    g = reduceGame(g, { type: 'PLANT', plot: 5, crop: 'grapes', now: g.lastAt });
    const loaded = restore(JSON.stringify(g), g.lastAt).game;
    expect(loaded).toEqual({ ...g, bandit: null, effect: null }); invariant(loaded);
  });
  it('matures offline once, never simulates theft or repeats offline growth after refresh', () => {
    let g = reduceGame(start(), { type: 'PLANT', plot: 0, crop: 'carrot', now: 1_000_000 });
    g = restore(JSON.stringify(g), g.lastAt + 30_000).game; expect(g.plots[0]?.growth).toBe(30_000);
    const again = restore(JSON.stringify(g), g.lastAt).game; expect(again.plots[0]?.growth).toBe(30_000);
    g = restore(JSON.stringify(g), g.lastAt + 8 * 60 * 60 * 1000).game;
    expect(g.plots[0]?.growth).toBe(45_000); expect(g.stolen).toBe(0); expect(g.activeMs).toBe(0);
  });
  it('awards exactly 10% live speed, with no stacking, offline bonus, or backwards-clock duplication', () => {
    let g = reduceGame(start(), { type: 'PLANT', plot: 0, crop: 'carrot', now: 1_000_000 });
    g = step(g, 10_000, true, true); expect(g.plots[0]?.growth).toBe(11_000);
    const previous = g.lastAt;
    g = reduceGame(g, { type: 'TICK', now: previous - 1000, active: true, sunshine: true });
    expect(g.lastAt).toBe(previous); expect(g.plots[0]?.growth).toBe(11_000);
    g = restore(JSON.stringify(g), previous + 10_000).game; expect(g.plots[0]?.growth).toBe(21_000);
    g = reduceGame(g, { type: 'TICK', now: g.lastAt + 10_000, active: true, sunshine: true });
    expect(g.plots[0]?.growth).toBe(31_000); // stalled frame gets base growth only
  });
  it('abandons interrupted raids without offline crop loss', () => {
    const g = raid(start()), loaded = restore(JSON.stringify(g), g.lastAt + 60_000).game;
    expect(loaded.bandit).toBeNull(); expect(loaded.stolen).toBe(0); expect(loaded.plots[0]?.lost).toBe(0);
  });
  it('rejects malformed or inconsistent saves', () => {
    expect(restore('{bad', 1_000_000).recovered).toBe(true);
    expect(restore(JSON.stringify({ ...start(), balance: 10 }), 1_000_000).recovered).toBe(true);
    expect(restore(JSON.stringify({ ...start(), inventory: { sunflower: -1 } }), 1_000_000).recovered).toBe(true);
  });
  it('preserves accounting through 3000 deterministic mixed actions', () => {
    let g = funded(); let seed = 51241;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 3000; i++) {
      const crop = CROP_IDS[Math.floor(random() * 6)], plot = Math.floor(random() * 8);
      switch (Math.floor(random() * 8)) {
        case 0: g = reduceGame(g, { type: 'PLANT', crop, plot, now: g.lastAt }); break;
        case 1: g = reduceGame(g, { type: 'HARVEST_ALL', now: g.lastAt }); break;
        case 2: g = reduceGame(g, { type: 'SELL', crop, quantity: Math.floor(random() * 20) }); break;
        case 3: g = reduceGame(g, { type: 'UNLOCK', crop }); break;
        case 4: g = reduceGame(g, { type: 'EXPAND' }); break;
        case 5: g = reduceGame(g, { type: 'DEFENSE', slot: Math.floor(random() * 3) }); break;
        case 6: g = reduceGame(g, { type: 'SELL' }); break;
        case 7: g = step(g, 5000, true, random() > .5); break;
      }
      invariant(g);
    }
  });
});
describe('verified public wheel response', () => {
  const now = Date.parse('2026-11-04T12:00:00Z');
  const measurement = { freshness: 'online', observedAt: new Date(now - 1000).toISOString(), receivedAt: new Date(now - 500).toISOString(), staleAfterSeconds: 120, provenance: 'hardware', coreStatus: 'ACTIVE', rpmMilli: 12500, speedMmPerSecond: 100 };
  const response = { schemaVersion: 1, generatedAt: new Date(now).toISOString(), measurement, oracle: { state: 'accepted' } };
  it('recognizes spinning and resting without inventing status', () => {
    const w = parseWheel(response, now); expect(w.status).toBe('spinning'); expect(w.rpm).toBe(12.5);
    expect(parseWheel({ ...response, measurement: { ...measurement, coreStatus: 'IDLE', rpmMilli: 0, speedMmPerSecond: 0 } }, now).status).toBe('resting');
  });
  it('rejects unavailable, stale, future, simulated, rejected, malformed and unknown-version responses', () => {
    const bad = [null, {}, { ...response, schemaVersion: 2 }, { ...response, status: 'unavailable' },
      { ...response, measurement: null }, { ...response, oracle: { state: 'blocked' } },
      ...[{ freshness: 'stale' }, { provenance: 'simulated' }, { rpmMilli: -1 }, { rpmMilli: '12500' }, { coreStatus: 'COUNTER_FAULT' }, { observedAt: new Date(now - 121000).toISOString() }, { receivedAt: new Date(now + 10000).toISOString() }].map(m => ({ ...response, measurement: { ...measurement, ...m } })),
    ];
    bad.forEach(data => expect(parseWheel(data, now).status).toBe('offline'));
  });
});
