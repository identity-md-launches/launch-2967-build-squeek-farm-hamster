import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CropArt, FarmWorld, Hamster, Icon, PlotArt, WeaponArt, positionStyle, type IconName } from './art';
import { API_DOCS, API_URL, fetchWheel, OFFLINE, type Wheel } from './chain';
import { CROP_IDS, CROPS, DEFENSES, PLOT_POS, SAVE_KEY, inventoryCount, inventoryValue, mature, newGame, reduceGame, remaining, restore, type Action, type CropId } from './game';

type ModalName = 'market' | 'expand' | 'defense' | 'economy' | 'help' | 'wheel' | null;
type SaveStatus = 'saved' | 'unavailable' | 'recovered';
const number = (n: number) => n.toLocaleString('en-US');
function initialSave() {
  try {
    const r = restore(localStorage.getItem(SAVE_KEY), Date.now());
    return { game: r.game, status: (r.recovered ? 'recovered' : 'saved') as SaveStatus };
  } catch { return { game: newGame(), status: 'unavailable' as SaveStatus }; }
}
function sound(kind: string) {
  try {
    const ctx = new AudioContext();
    const notes = kind === 'sale' ? [523, 659, 784, 1047] : kind === 'retreat' ? [330, 277, 220] : kind === 'harvest' ? [660, 880, 1100] : [440, 554];
    notes.forEach((hz, i) => {
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = hz;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * .09);
      gain.gain.linearRampToValueAtTime(.045, ctx.currentTime + i * .09 + .015);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .09 + .18);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + i * .09); oscillator.stop(ctx.currentTime + i * .09 + .2);
    });
    setTimeout(() => { void ctx.close(); }, 800);
  } catch { /* Sound is optional; the visual action always completes. */ }
}
function Confetti() {
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i, left: `${i * 4.2}%`, background: ['#f7cd53', '#ec9a83', '#83b45d', '#a99ad4'][i % 4] } as React.CSSProperties} />)}</div>;
}
function Modal({ title, children, onClose, wide = false, celebrate = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; celebrate?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => {
    const d = ref.current; d?.showModal();
    return () => { d?.close(); if (opener.current?.isConnected) opener.current.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={e => {
    if (e.key !== 'Tab') return;
    const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }}>
    <div className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>
    <div className="modal-body">{children}</div>
    {celebrate && <Confetti />}
  </dialog>;
}
function Gold({ value, label = true }: { value: number; label?: boolean }) { return <span className="gold-value"><Icon name="coin" size={20} /><span>{number(value)}{label && ' GOLD'}</span></span>; }
function PurchaseButton({ cost, balance, onClick, label, bought = false }: { cost: number; balance: number; onClick: () => void; label: string; bought?: boolean }) {
  return <div className="purchase-action"><button className={bought ? 'button installed' : 'button small'} disabled={bought || balance < cost} onClick={onClick}>
    {bought ? <><Icon name="check" size={18} /> Installed</> : <>{label}<Gold value={cost} label={false} /></>}
  </button>{!bought && balance < cost && <span className="need-gold">{number(cost - balance)} more GOLD needed</span>}</div>;
}

export default function App() {
  const [initial] = useState(initialSave);
  const [game, setGame] = useState(initial.game);
  const gameRef = useRef(game);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(initial.status);
  const [saveNoticeDismissed, setSaveNoticeDismissed] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [selected, setSelected] = useState<CropId>('sunflower');
  const [mode, setMode] = useState<'plant' | 'harvest'>('plant');
  const [paused, setPaused] = useState(false);
  const [wheel, setWheel] = useState<Wheel>({ ...OFFLINE, status: 'checking', reason: 'Checking the real hamster wheel…' });
  const [pip, setPip] = useState({ x: 280, y: 445, pose: 'idle' });
  const [owner, setOwner] = useState(false);
  const [lockAttempt, setLockAttempt] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [notice, setNotice] = useState('');
  const activeRef = useRef(false), wheelRef = useRef(wheel), ownerRef = useRef(owner);
  const lastEvent = useRef(game.eventId);
  const pipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = useCallback((action: Action) => {
    if (!ownerRef.current) return;
    if (action.type === 'TICK' && !gameRef.current.started) return;
    const next = reduceGame(gameRef.current, action);
    if (next === gameRef.current) return;
    gameRef.current = next; setGame(next);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setSaveStatus('saved'); } catch { setSaveStatus('unavailable'); }
  }, []);

  useEffect(() => {
    let disposed = false;
    let release: (() => void) | undefined;
    const activate = () => {
      if (disposed) return;
      const loaded = initialSave();
      gameRef.current = loaded.game; setGame(loaded.game);
      ownerRef.current = true; setOwner(true);
    };
    // One writer per browser prevents duplicate sales/rewards across open tabs.
    if (navigator.locks) {
      void navigator.locks.request('squeek-farm-save-writer', { ifAvailable: true }, async lock => {
        if (!lock || disposed) return;
        activate();
        await new Promise<void>(resolve => { release = resolve; if (disposed) resolve(); });
      }).catch(() => { activate(); });
    } else activate();
    const sync = (e: StorageEvent) => {
      if (e.key !== SAVE_KEY || ownerRef.current || !e.newValue) return;
      const loaded = restore(e.newValue, Date.now()); gameRef.current = loaded.game; setGame(loaded.game);
    };
    addEventListener('storage', sync);
    return () => { disposed = true; ownerRef.current = false; release?.(); removeEventListener('storage', sync); };
  }, [lockAttempt]);
  useEffect(() => { ownerRef.current = owner; }, [owner]);
  useEffect(() => {
    activeRef.current = game.started && !paused && modal !== 'help' && owner;
  }, [game.started, paused, modal, owner]);
  useEffect(() => { wheelRef.current = wheel; }, [wheel]);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now(), w = wheelRef.current;
      if (w.expiresAt > 0 && now >= w.expiresAt && w.status !== 'offline') setWheel({ ...OFFLINE, reason: 'The wheel reading expired. Farming continues at normal speed.' });
      commit({ type: 'TICK', now, active: !document.hidden && activeRef.current, sunshine: w.status === 'spinning' && now < w.expiresAt });
    }, 250);
    const visibility = () => { commit({ type: 'TICK', now: Date.now(), active: false, sunshine: false }); };
    document.addEventListener('visibilitychange', visibility);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [commit]);
  useEffect(() => {
    let disposed = false;
    let polling = false;
    let controller: AbortController;
    async function poll() {
      if (document.hidden || polling) return;
      polling = true;
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => request.abort(), 8000);
      const result = await fetchWheel(request.signal);
      clearTimeout(timeout);
      polling = false;
      if (!disposed) setWheel(result);
    }
    void poll();
    const timer = setInterval(() => { void poll(); }, 15000);
    const visibility = () => { if (!document.hidden) void poll(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (game.eventId === lastEvent.current) return;
    lastEvent.current = game.eventId;
    if (game.sound && game.effect && game.effect.kind !== 'shot') sound(game.effect.kind);
    if (game.effect?.kind === 'expand' || game.effect?.kind === 'defense') {
      setCelebrate(true); const timer = setTimeout(() => setCelebrate(false), 2500); return () => clearTimeout(timer);
    }
  }, [game.eventId, game.effect, game.sound]);
  useEffect(() => () => { if (pipTimer.current) clearTimeout(pipTimer.current); }, []);

  const start = () => { commit({ type: 'START', now: Date.now() }); };
  const movePip = (plot: number, pose: string) => {
    if (pipTimer.current) clearTimeout(pipTimer.current);
    const [x, y] = PLOT_POS[plot];
    setPip({ x: x - 62, y: y + 55, pose: 'walk' });
    pipTimer.current = setTimeout(() => {
      setPip(p => ({ ...p, pose }));
      pipTimer.current = setTimeout(() => setPip(p => ({ ...p, pose: 'idle' })), 750);
    }, 550);
  };
  const plotAction = (index: number) => {
    if (!owner || paused) return;
    const p = gameRef.current.plots[index];
    if (mature(p)) { commit({ type: 'HARVEST', plot: index, now: Date.now() }); movePip(index, 'harvest'); }
    else if (!p) {
      if (mode === 'harvest') { setMode('plant'); }
      commit({ type: 'PLANT', plot: index, crop: selected, now: Date.now() }); movePip(index, 'plant');
    } else {
      setNotice(`${CROPS[p.crop].name} is growing. Ready in ${remaining(p)} seconds.`);
      movePip(index, 'idle');
    }
  };
  const harvestAll = () => {
    const target = gameRef.current.plots.findIndex(mature);
    setMode('harvest');
    if (target >= 0) { commit({ type: 'HARVEST_ALL', now: Date.now() }); movePip(target, 'harvest'); }
    else setNotice('Your harvest is on its way. Select a crop and plant an empty plot.');
  };
  const buyCrop = (id: CropId) => {
    const before = gameRef.current;
    commit({ type: 'UNLOCK', crop: id });
    if (gameRef.current !== before) { setSelected(id); setMode('plant'); }
  };
  const readyCount = game.plots.filter(mature).length;
  const protection = Math.max(0, Math.ceil((90000 - game.activeMs) / 1000));
  const currentWheel = wheel.status === 'spinning' ? 'Wheel spinning' : wheel.status === 'resting' ? 'Wheel resting' : wheel.status === 'checking' ? 'Checking wheel' : 'Offline';
  const tutorialTexts = [
    ['Meet Pip. Your new farmhand.', 'Pick a seed below, then select an empty plot. Planting is always free.'],
    ['Good things are growing.', 'Sunflowers take 30 seconds. Plant the other plots while you wait.'],
    ['A basket full of possibility.', 'Open the Market to sell your harvest and earn your first GOLD.'],
    ['You’re a natural, farmer.', 'Save for new seeds, more land, and a little protection from Brutus.'],
    ['Make yourself at home.', 'Grow a little, sell a little, and build your own hamster haven.'],
  ];
  const [tutorialTitle, tutorialText] = tutorialTexts[game.tutorial];
  const showFeedback = notice || game.message;

  return <div className={`app ${game.started ? 'is-playing' : 'is-title'}`}>
    <a className="skip-link" href="#farm">Skip to farm</a>
    <header className="site-header">
      <a href="#farm" className="brand" aria-label="Squeek Farm home"><span className="brand-mark"><Icon name="seed" size={31} /></span><span>Squeek<span className="brand-farm">farm</span></span></a>
      <span className="genesis-label">A Squeekchain Genesis game</span>
      <div className="header-utilities">
        <button className={`chain-button ${wheel.status}`} onClick={() => setModal('wheel')}><span className="status-dot" /><span>{currentWheel}</span><Icon name="wheel" size={18} /></button>
        <button className="icon-button sound-control" aria-label={game.sound ? 'Mute sound' : 'Enable sound'} aria-pressed={game.sound} onClick={() => { commit({ type: 'SOUND' }); if (!game.sound) sound('plant'); }}><Icon name={game.sound ? 'sound' : 'muted'} size={21} /></button>
        <button className="icon-button" aria-label="How to play" onClick={() => setModal('help')}><Icon name="help" size={22} /></button>
      </div>
    </header>
    <main id="farm" className="main-content">
      {!game.started ? <section className="welcome" aria-label="Welcome to Squeek Farm">
        <div className="welcome-scene"><FarmWorld />
          <div className="welcome-plant welcome-plant-one"><CropArt crop="sunflower" /></div><div className="welcome-plant welcome-plant-two"><CropArt crop="carrot" /></div>
          <div className="welcome-pip"><Hamster /><span className="character-bubble">Hi, I’m Pip!</span></div>
          <div className="welcome-brutus"><Hamster kind="brutus" pose="sneak" /></div>
        </div>
        <div className="welcome-copy">
          <h1 className="game-title" aria-label="Squeek Farm"><svg viewBox="0 0 500 250" aria-hidden="true"><text x="250" y="96" textAnchor="middle" fill="#fff6d4" stroke="#78633b" strokeWidth="3" paintOrder="stroke fill" fontSize="110" fontFamily="Lilita One">Squeek</text><text x="250" y="233" textAnchor="middle" fill="#f9d56d" stroke="#78633b" strokeWidth="3" paintOrder="stroke fill" fontSize="165" fontFamily="Lilita One">Farm</text></svg></h1>
          <div className="title-ribbon">Hamster Wars</div>
          <p className="tagline">Grow. Harvest. Defend. Expand.</p>
          <p className="welcome-description">A cozy farming &amp; defense adventure.</p>
          <button className="button play-button" disabled={!owner} onClick={start}>Play now <Icon name="play" size={24} /></button>
          <span className="play-note">Free to play · no wallet needed</span>
        </div>
        <div className="welcome-bottom"><span><Icon name="leaf" size={18} /> Your own little hamster haven</span><span>A world of homegrown mischief</span></div>
      </section> : <>
        <div className="farm-heading"><div><h1>Pip’s little paradise</h1><span>Grow. Harvest. Defend. Expand.</span></div>
          <div className="wallet-hud" aria-label={`Balance: ${game.balance} GOLD`}><Icon name="coin" size={30} /><div><span>GOLD</span><strong data-testid="balance">{number(game.balance)}</strong></div><button className="hud-add" aria-label="Open market to earn GOLD" onClick={() => setModal('market')}><Icon name="market" size={21} /></button></div>
        </div>
        <div className="game-layout">
          <section className="farm-board" aria-label="Interactive farm">
            <div className="farm-topline"><span><Icon name="leaf" size={17} /> {game.plotCount} little plots of happiness</span><button className="pause-button" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Resume game' : 'Pause game'}><Icon name={paused ? 'play' : 'pause'} size={17} />{paused ? 'Resume' : 'Pause'}</button></div>
            <div className={`world ${paused ? 'world-paused' : ''}`}>
              <div className="world-inner"><FarmWorld />
                <button className="world-market" style={positionStyle(950, 286)} onClick={() => setModal('market')} aria-label="Visit the farm market"><Icon name="market" size={15} /> Visit market</button>
                {game.plots.map((p, index) => {
                  if (index >= game.plotCount) return null;
                  const [x, y] = PLOT_POS[index];
                  const isMature = mature(p), stage = !p ? 0 : isMature ? 2 : p.growth < CROPS[p.crop].seconds * 320 ? 0 : 1;
                  const yieldLeft = p ? CROPS[p.crop].quantity - p.lost : 0;
                  return <button key={index} className={`plot ${p ? isMature ? 'ready' : 'growing' : 'empty'}`} style={positionStyle(x, y)} onClick={() => plotAction(index)} disabled={paused || !owner}
                    aria-label={p ? isMature ? `Harvest ${yieldLeft} ${CROPS[p.crop].name} from plot ${index + 1}` : `${CROPS[p.crop].name}, plot ${index + 1}, ${remaining(p)} seconds remaining` : `Plant ${CROPS[selected].name} in plot ${index + 1}`} data-testid={`plot-${index}`} data-stage={p ? stage : 'empty'} data-crop={p?.crop ?? ''}>
                    <PlotArt crop={p?.crop} stage={stage} ready={isMature} />
                    {!p ? <span className="plot-label"><Icon name="seed" size={15} /> Plant</span> : isMature ? <span className="plot-label ripe-label"><Icon name="basket" size={14} /> +{yieldLeft}</span> : <span className="plot-label grow-label"><span className="growth-fill" style={{ width: `${Math.min(100, p.growth / (CROPS[p.crop].seconds * 10))}%` }} /><span><Icon name="clock" size={12} />{remaining(p)}s</span></span>}
                    {p && isMature && <span className="ripe-sparkle" aria-hidden="true">✦</span>}
                  </button>;
                })}
                {game.plotCount < 6 && <button className="locked-area expansion-one" style={positionStyle(750, 435)} onClick={() => setModal('expand')} aria-label="Unlock two more plots for 100 GOLD"><span className="locked-earth"><Icon name="lock" size={25} /></span><span>Room to grow</span><Gold value={100} label={false} /></button>}
                {game.plotCount < 8 && <button className="locked-area expansion-two" style={positionStyle(920, 435)} onClick={() => setModal('expand')} aria-label="View second expansion, 250 GOLD"><span className="locked-earth"><Icon name="lock" size={25} /></span><span>A bigger dream</span><Gold value={250} label={false} /></button>}
                {DEFENSES.map((d, i) => <button key={i} className={`defense-slot ${game.defenses[i] ? 'built' : ''} ${game.effect?.weapon === i && ['shot', 'retreat'].includes(game.effect.kind) ? 'firing' : ''}`} style={positionStyle(d.x, d.y)} onClick={() => setModal('defense')} aria-label={game.defenses[i] ? `${d.name}, installed` : `Build ${d.name} for ${d.cost} GOLD`}>
                  {game.defenses[i] ? <WeaponArt slot={i} key={game.effect?.weapon === i ? game.eventId : 0} /> : <><span className="build-pad"><Icon name="shield" size={23} /><span>+</span></span><span className="slot-label">Defense {i + 1}</span></>}
                </button>)}
                <div className="pip-sprite" style={positionStyle(pip.x, pip.y)}><Hamster pose={pip.pose} /></div>
                {game.bandit && <div className={`bandit-sprite phase-${game.bandit.phase}`} style={positionStyle(game.bandit.x, game.bandit.y)}><Hamster kind="brutus" pose={game.bandit.phase === 'steal' ? 'plant' : 'sneak'} /><span className="bandit-bubble">{game.bandit.phase === 'repelled' ? 'Unfair! So many seeds!' : game.bandit.phase === 'escape' ? 'Finders keepers!' : game.bandit.phase === 'warning' ? 'Well, hello there…' : 'Just… browsing.'}</span></div>}
                {game.effect && game.effect.weapon !== undefined && ['shot', 'retreat'].includes(game.effect.kind) && game.bandit && <svg key={game.eventId} className="projectiles" viewBox="0 0 1200 790" aria-hidden="true"><path d={`M${DEFENSES[game.effect.weapon].x} ${DEFENSES[game.effect.weapon].y - 35} Q${game.bandit.x - 40} ${game.bandit.y - 100} ${game.bandit.x} ${game.bandit.y}`} fill="none" stroke="#ffed9b" strokeWidth="5" strokeDasharray="12 15" strokeLinecap="round" className="seed-shot" /><circle cx={game.bandit.x} cy={game.bandit.y} r="17" fill="#fce8a3" opacity=".7" /></svg>}
                {game.effect?.kind === 'harvest' && <div key={game.eventId} className="harvest-pop" style={positionStyle(PLOT_POS[game.effect.plot ?? 0][0], PLOT_POS[game.effect.plot ?? 0][1])}><span>+{game.effect.amount}</span>{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties}>✦</i>)}</div>}
              </div>
              {paused && <div className="pause-overlay"><Icon name="pause" size={36} /><strong>A little breather</strong><span>Your crops keep growing.</span><button className="button" onClick={() => setPaused(false)}>Back to the farm <Icon name="arrow" size={18} /></button></div>}
              {celebrate && <Confetti />}
            </div>
            <div className={`farm-status ${game.bandit && game.bandit.phase !== 'repelled' ? 'raid-warning' : ''}`} role={game.bandit ? 'alert' : undefined}>
              <Icon name={game.bandit ? 'shield' : protection > 0 ? 'shield' : wheel.status === 'spinning' ? 'sun' : 'leaf'} size={19} />
              <span>{game.bandit && game.bandit.phase !== 'repelled' ? 'Brutus is here! Harvest now or trust your defenses.' : protection > 0 ? `Beginner protection · ${protection}s of active play left` : wheel.status === 'spinning' ? 'Squeek Sunshine · 10% faster crop growth' : 'Cozy skies. Happy crops. Keep an eye out for Brutus.'}</span>
            </div>
            <nav className="action-dock" aria-label="Farm actions">
              {([
                ['Plant', 'seed', () => { setMode('plant'); setNotice('Select a seed, then choose an empty plot. Planting is free.'); }, mode === 'plant'],
                ['Harvest', 'basket', harvestAll, mode === 'harvest'],
                ['Market', 'market', () => setModal('market'), false],
                ['Expand', 'expand', () => setModal('expand'), false],
                ['Defense', 'shield', () => setModal('defense'), false],
                ['Economy', 'coin', () => setModal('economy'), false],
              ] as [string, IconName, () => void, boolean][]).map(([label, icon, action, active]) => <button key={label} className={`dock-button ${active ? 'active' : ''}`} onClick={action} aria-label={label} aria-pressed={['Plant', 'Harvest'].includes(label) ? active : undefined} disabled={!owner || paused}>
                <span className="dock-icon"><Icon name={icon} size={26} />{label === 'Harvest' && readyCount > 0 && <span className="count-badge">{readyCount}</span>}{label === 'Market' && inventoryCount(game) > 0 && <span className="count-badge">{inventoryCount(game)}</span>}</span><span>{label}</span>
              </button>)}
            </nav>
          </section>
          <aside className="seed-shed" aria-label="Seeds and farm guide">
            <div className="shed-heading"><Icon name="seed" size={24} /><h2>The seed shed</h2><span>Plant for free</span></div>
            <div className="seed-grid" aria-label="Choose a crop">
              {CROP_IDS.map(id => {
                const crop = CROPS[id], unlocked = game.unlocked.includes(id);
                return <button key={id} className={`seed-choice ${selected === id ? 'selected' : ''} ${unlocked ? '' : 'locked-seed'}`} onClick={() => { if (unlocked) { setSelected(id); setMode('plant'); setNotice(''); } else setModal('market'); }} aria-label={unlocked ? `Select ${crop.name}, ${crop.seconds} seconds, ${crop.quantity} units` : `Unlock ${crop.name} for ${crop.unlock} GOLD in the market`} aria-pressed={unlocked ? selected === id : undefined}>
                  <CropArt crop={id} /><span className="seed-name">{crop.name}</span><span className="seed-meta">{unlocked ? <><Icon name="clock" size={12} /> {crop.seconds}s</> : <><Icon name="lock" size={12} /> {crop.unlock}</>}</span>{selected === id && <span className="selected-check"><Icon name="check" size={12} /></span>}
                </button>;
              })}
            </div>
            <div className="selected-info"><CropArt crop={selected} /><div><strong>{CROPS[selected].name}</strong><span>{CROPS[selected].quantity} per harvest · {CROPS[selected].price} GOLD each</span><span>Select an empty plot to plant.</span></div></div>
            {wheel.status === 'spinning' && <div className="sunshine-active"><Icon name="sun" size={19} /><strong>Squeek Sunshine</strong><span>+10% growth</span></div>}
            <button className="basket-summary" onClick={() => setModal('market')}><Icon name="basket" size={25} /><span><strong>Harvest basket</strong><span>{number(inventoryCount(game))} goods · {number(inventoryValue(game))} GOLD value</span></span><Icon name="arrow" size={18} /></button>
            <div className="pip-note"><div className="note-portrait"><Hamster /></div><div><h3>{tutorialTitle}</h3><p>{tutorialText}</p>{game.tutorial === 3 && <button className="text-button" onClick={() => commit({ type: 'TUTORIAL' })}>I’ve got this <Icon name="check" size={16} /></button>}</div></div>
            <div className="farm-progress"><span><Icon name="basket" size={16} /> Harvested <strong>{number(game.harvested)}</strong></span><span><Icon name="shield" size={16} /> Repelled <strong>{number(game.repelled)}</strong></span></div>
          </aside>
        </div>
        <div className="feedback-strip" role="status" aria-live="polite"><span className="feedback-leaf"><Icon name="leaf" size={18} /></span><span>{showFeedback}</span>{notice && <button className="icon-button" aria-label="Dismiss farm tip" onClick={() => setNotice('')}><Icon name="close" size={16} /></button>}</div>
      </>}
      {!owner && <div className="save-warning" role="status">This farm may be open in another tab. Close that tab to keep one safe save.<button className="text-button" onClick={() => setLockAttempt(n => n + 1)}>Continue here</button></div>}
      {saveStatus !== 'saved' && !saveNoticeDismissed && <div className="save-warning" role="alert">{saveStatus === 'unavailable' ? 'Browser storage is unavailable. You can play, but progress will be lost when this page closes. Enable site storage to save.' : 'The previous save could not be restored. A new farm is ready; starting it replaces the damaged save.'}<button className="text-button" onClick={() => setSaveNoticeDismissed(true)}>Dismiss</button></div>}
    </main>
    <footer className="site-footer"><span><Icon name="seed" size={17} /> Made for the Squeekchain Genesis universe</span><span className="save-indicator"><Icon name={saveStatus === 'saved' ? 'check' : 'help'} size={16} />{saveStatus === 'saved' ? game.started ? 'Saved on this device' : 'Saves on this device' : 'Check save status'}<span className="footer-divider">·</span>GOLD is virtual game currency</span></footer>

    {modal && <Modal title={{ market: 'The little farm market', expand: 'Room for bigger dreams', defense: 'A little farm security', economy: 'Where the GOLD goes', help: 'Welcome to the good life', wheel: 'A little Squeek Sunshine' }[modal]} onClose={() => setModal(null)} wide={modal === 'market'} celebrate={celebrate}>
      {modal === 'market' && <>
        <div className="market-summary"><div><Icon name="basket" size={34} /><div><strong>{inventoryCount(game)} goods in your basket</strong><span>Harvest first. Sell when you’re ready.</span></div></div><Gold value={game.balance} /></div>
        <div className="market-list">
          {CROP_IDS.map(id => <div className="market-row" key={id}>
            <CropArt crop={id} /><div className="market-crop"><strong>{CROPS[id].name}</strong><span>{CROPS[id].price} GOLD / unit · {game.inventory[id]} in stock</span></div>
            {game.unlocked.includes(id) ? <div className="sale-actions"><button className="button neutral small" disabled={game.inventory[id] < 1 || !owner} aria-label={`Sell one ${CROPS[id].name}`} onClick={() => commit({ type: 'SELL', crop: id, quantity: 1 })}>Sell 1</button><button className="button neutral small" disabled={game.inventory[id] < 1 || !owner} aria-label={`Sell all ${CROPS[id].name}`} onClick={() => commit({ type: 'SELL', crop: id })}>Sell {game.inventory[id]}<Gold value={game.inventory[id] * CROPS[id].price} label={false} /></button></div> : <PurchaseButton label="Unlock" cost={CROPS[id].unlock} balance={game.balance} onClick={() => buyCrop(id)} />}
          </div>)}
        </div>
        <div className="modal-footer-action"><p>Seeds are a one-time unlock.<br />Planting is always free.</p><button className="button" disabled={inventoryValue(game) === 0 || !owner} onClick={() => commit({ type: 'SELL' })}>Sell all goods <Gold value={inventoryValue(game)} /></button></div>
        <div className="shop-feedback" role="status">{game.message}</div><p className="fine-print">Purchases: 80% burned · 20% to the local game treasury.</p>
      </>}
      {modal === 'expand' && <>
        <p className="dialog-intro">More soil. More sunflowers. More room to make a mess.</p>
        <div className="expansion-illustration"><PlotArt crop="sunflower" stage={2} /><PlotArt crop="carrot" stage={2} /><Icon name="expand" size={36} /></div>
        <div className="expansion-step"><span className="step-number">1</span><div><h3>The sunny patch</h3><p>4 → 6 playable plots</p></div>{game.plotCount >= 6 ? <span className="owned-label"><Icon name="check" size={18} /> Unlocked</span> : <PurchaseButton label="Expand" cost={100} balance={game.balance} onClick={() => commit({ type: 'EXPAND' })} />}</div>
        <div className="expansion-step"><span className="step-number">2</span><div><h3>The meadow stretch</h3><p>6 → 8 playable plots</p></div>{game.plotCount === 8 ? <span className="owned-label"><Icon name="check" size={18} /> Unlocked</span> : game.plotCount < 6 ? <span className="next-expansion"><Icon name="lock" size={16} /> Unlock sunny patch first<Gold value={250} /></span> : <PurchaseButton label="Expand" cost={250} balance={game.balance} onClick={() => commit({ type: 'EXPAND' })} />}</div>
        <p className="fine-print">8 plots maximum. Purchases burn 80%; 20% goes to the treasury.</p><div className="shop-feedback" role="status">{game.message}</div>
      </>}
      {modal === 'defense' && <>
        <p className="dialog-intro">Brutus has sticky paws. These hamsters have a plan.</p>
        <div className="defense-list">{DEFENSES.map((d, i) => <div className="defense-row" key={d.name}><WeaponArt slot={i} /><div><h3>{d.name}</h3><span className="range-label">{d.rangeName}</span><p>{d.description}</p><span className="weapon-detail">Automatic · no ammo or repairs</span></div><PurchaseButton cost={d.cost} balance={game.balance} onClick={() => commit({ type: 'DEFENSE', slot: i })} label="Build" bought={game.defenses[i]} /></div>)}</div>
        <p className="fine-print">Each weapon has its own fixed slot. 80% of GOLD spent is burned; 20% goes to the treasury.</p><div className="shop-feedback" role="status">{game.message}</div>
      </>}
      {modal === 'economy' && <>
        <p className="dialog-intro">Grown on your farm. Counted down to the last coin.</p>
        <div className="economy-visual"><Icon name="coin" size={64} /><div><strong>{number(game.balance)}</strong><span>Your GOLD balance</span></div></div>
        <dl className="ledger"><div><dt>Minted through crop sales</dt><dd>{number(game.minted)}</dd></div><div><dt>In your pocket</dt><dd>{number(game.balance)}</dd></div><div><dt>Game treasury <span>20% of purchases</span></dt><dd>{number(game.treasury)}</dd></div><div><dt>Burned forever <span>80% of purchases</span></dt><dd>{number(game.burned)}</dd></div><div className="ledger-total"><dt>Outstanding supply <span>Player + treasury</span></dt><dd>{number(game.balance + game.treasury)}</dd></div></dl>
        <div className="accounting-check"><Icon name="check" size={20} /><span>{number(game.minted)} minted = {number(game.balance)} player + {number(game.treasury)} treasury + {number(game.burned)} burned</span></div>
        <p className="economy-disclaimer">This ledger belongs to this device’s save. GOLD is virtual game currency. It is not a real token or global blockchain supply. No wallet, withdrawals, cash value, or guaranteed deflation.</p>
      </>}
      {modal === 'help' && <>
        <div className="help-welcome"><Hamster /><div><h3>Small paws. Big adventures.</h3><p>Help Pip grow a happy little farm. Keep the harvest out of Brutus’s loot sack.</p></div></div>
        <ol className="help-steps"><li><Icon name="seed" /><div><strong>Plant a little sunshine</strong><p>Choose a seed, then an empty plot. Sunflower and Carrot are unlocked. Planting is free.</p></div></li><li><Icon name="basket" /><div><strong>Bring in the harvest</strong><p>Tap a ripe crop, or use Harvest for all ripe plots. Crops go safely into your basket.</p></div></li><li><Icon name="market" /><div><strong>Make it a market day</strong><p>Sell crops for GOLD. Unlock new seeds, expand to 8 plots, and build automatic defenses.</p></div></li><li><Icon name="shield" /><div><strong>Watch those cheeky bandits</strong><p>After 90 seconds of active beginner protection, Brutus visits every 90–150 seconds when ripe crops are around. Harvest first or let defenses repel him. He can only take up to 4 units from one crop after escaping.</p></div></li></ol>
        <p className="fine-print">Your basket and GOLD are always safe. Crops mature offline at normal speed; theft never happens offline. Progress is stored in this browser. This help pauses bandit activity.</p>
        <button className="text-button" onClick={() => { commit({ type: 'SOUND' }); if (!game.sound) sound('plant'); }}><Icon name={game.sound ? 'sound' : 'muted'} size={18} />{game.sound ? 'Mute game sounds' : 'Enable game sounds'}</button>
        <button className="button full-width" onClick={() => setModal(null)}>Back to the sunshine <Icon name="arrow" size={18} /></button>
      </>}
      {modal === 'wheel' && <>
        <div className={`wheel-illustration ${wheel.status === 'spinning' ? 'spinning' : ''}`}><Icon name="wheel" size={120} /><Hamster pose={wheel.status === 'spinning' ? 'walk' : 'idle'} /><span><Icon name="sun" size={28} /></span></div>
        <h3 className="wheel-title">{currentWheel}{wheel.rpm !== null && ` · ${wheel.rpm.toFixed(1)} RPM`}</h3><p className="dialog-intro">{wheel.reason}</p>
        <div className="sunshine-rule"><Icon name="sun" size={26} /><div><strong>Squeek Sunshine</strong><p>Fresh, accepted hardware readings of a spinning wheel activate a capped 10% growth-speed bonus while you play. It never stacks, and isn’t awarded for time away.</p></div></div>
        <p className="fine-print">Read-only public API, polled every 15 seconds. Stale, simulated, unavailable, or blocked responses show Offline and keep normal farming.</p><div className="source-links"><a href={API_DOCS} target="_blank" rel="noreferrer">Squeekchain API docs <Icon name="arrow" size={15} /></a><a href={API_URL} target="_blank" rel="noreferrer">View public status <Icon name="arrow" size={15} /></a></div>
      </>}
    </Modal>}
  </div>;
}
