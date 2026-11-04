import type { CSSProperties } from 'react';
import type { CropId } from './game';

export type IconName = 'seed' | 'basket' | 'market' | 'expand' | 'shield' | 'coin' | 'leaf' | 'close' | 'help' | 'sound' | 'muted' | 'arrow' | 'lock' | 'sun' | 'wheel' | 'check' | 'clock' | 'book' | 'pause' | 'play';
export function Icon({ name, size = 24, className = '' }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    seed: <><path d="M12 21v-9M12 15C3 16 3 7 3 7s9-1 9 8ZM12 11c0-7 8-8 8-8s2 9-8 10" /></>,
    basket: <><path d="m3 10 3 10h12l3-10ZM7 10l5-7 5 7M9 14v3m6-3v3M2 10h20" /></>,
    market: <><path d="M4 10v11h16V10M2 9l3-6h14l3 6M2 9c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0M9 21v-7h6v7" /></>,
    expand: <><path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6M4 4l5 5m11-5-5 5M4 20l5-5m11 5-5-5" /></>,
    shield: <><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6" /></>,
    coin: <><ellipse cx="12" cy="12" rx="9" ry="10" fill="#ffce4b" stroke="#b88224" /><path d="m13 6-4 6h6l-4 6" stroke="#a66b20" /></>,
    leaf: <><path d="M20 3S3 1 3 12s15 12 17-9ZM6 19 16 8M9 14l-1-4m4 1 4 1" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9c0-4 7-4 7 0 0 3-4 2-4 5m0 3h.01" /></>,
    sound: <><path d="m3 9 5 0 5-5v16l-5-5H3ZM17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" /></>,
    muted: <><path d="m3 9 5 0 5-5v16l-5-5H3Zm14 0 5 6m0-6-5 6" /></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
    wheel: <><circle cx="12" cy="11" r="9" /><circle cx="12" cy="11" r="2" /><path d="M12 2v7m9 2h-7m-2 9v-7m-9-2h7m-3 12h10" /></>,
    check: <path d="m5 12 4 5L20 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    book: <><path d="M12 5C9 2 3 3 3 3v16s6-1 9 2c3-3 9-2 9-2V3s-6-1-9 2Zm0 0v16" /></>,
    pause: <path d="M8 5v14M16 5v14" />,
    play: <path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none" />,
  };
  return <svg width={size} height={size} className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const Leaf = ({ x, y, rotate = 0, scale = 1 }: { x: number; y: number; rotate?: number; scale?: number }) => <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}><path d="M0 0C-28-3-28-28-28-28S1-30 0 0Z" fill="#66a94d" stroke="#3f783e" strokeWidth="2" /><path d="m-23-23 22 22" stroke="#8cc96a" strokeWidth="2" /></g>;
export function CropDrawing({ crop, stage = 2 }: { crop: CropId; stage?: number }) {
  if (stage === 0) return <g><ellipse cx="50" cy="91" rx="19" ry="5" fill="#62422a" opacity=".2" /><path d="M50 90V68" stroke="#498342" strokeWidth="5" strokeLinecap="round" /><Leaf x={50} y={76} scale={.65} /><Leaf x={50} y={73} scale={.65} rotate={85} /><circle cx="49" cy="62" r="4" fill="#a3c86b" /></g>;
  const young = stage === 1;
  return <g transform={young ? 'translate(13 20) scale(.75)' : undefined}>
    <ellipse cx="50" cy="94" rx="33" ry="6" fill="#61492c" opacity=".16" />
    {crop === 'sunflower' && <><path d="M50 92V45" stroke="#498447" strokeWidth="5" strokeLinecap="round" /><Leaf x={50} y={79} scale={.75} /><Leaf x={50} y={66} rotate={90} scale={.7} /><g className="flower-head" style={{ transformOrigin: '50px 36px' }}>{Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx="50" cy="15" rx="8" ry="15" transform={`rotate(${i * 36} 50 36)`} fill={i % 2 ? '#ffc942' : '#ffe46e'} stroke="#d49a37" strokeWidth="1.2" />)}<circle cx="50" cy="36" r="17" fill="#98592d" stroke="#754326" strokeWidth="2" /><circle cx="46" cy="31" r="12" fill="#b87536" />{[[-5, -6], [4, -7], [-9, 1], [0, 1], [8, 2], [-4, 8], [5, 9]].map(([x, y], i) => <circle key={i} cx={50 + x} cy={36 + y} r="1.8" fill="#e4b55d" />)}</g></>}
    {crop === 'carrot' && <>{[[-22, 7, -22], [19, 2, 22], [0, -5, 0]].map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r} 50 60)`}><path d="M37 57q0-12 13-12t13 12c-1 17-10 38-13 38S38 73 37 57Z" fill={i === 1 ? '#ffb04b' : '#f58c37'} stroke="#b9682f" strokeWidth="2" /><path d="m41 59 8 2m7 7 5-2m-16 12 7 2" stroke="#d46e2b" strokeWidth="2" strokeLinecap="round" /><path d="M50 48C32 41 30 25 35 21c10 4 14 15 15 27 1-18 2-28 9-32 8 12 2 24-9 32 14-16 22-17 25-13-2 9-14 13-25 13" fill="#68aa4a" stroke="#43803e" strokeWidth="2" /></g>)}</>}
    {crop === 'strawberry' && <><path d="M49 91V49" stroke="#4e8c45" strokeWidth="4" />{[[-18, 16, -25], [19, 10, 25], [0, -10, 0]].map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r} 50 55)`}><Leaf x={50} y={47} rotate={-10} scale={.9} /><Leaf x={50} y={47} rotate={95} scale={.8} /><path d="M31 57c0-16 38-16 38 0 0 13-14 29-19 29S31 70 31 57Z" fill={i === 1 ? '#f77e7a' : '#e95c65'} stroke="#b3404d" strokeWidth="2" /><path d="m35 47 8 9 7-9 6 8 8-8-14-6Z" fill="#79ad48" />{[[40, 60], [51, 58], [61, 61], [45, 70], [56, 70], [50, 79]].map(([sx, sy], j) => <ellipse key={j} cx={sx} cy={sy} rx="1.4" ry="2.3" fill="#ffe5a5" transform={`rotate(-15 ${sx} ${sy})`} />)}</g>)}</>}
    {crop === 'corn' && <><path d="M50 94V13" stroke="#4d8b41" strokeWidth="5" strokeLinecap="round" /><path d="m50 15-9-8m9 8 8-12m-8 12-1-15" stroke="#e0b25d" strokeWidth="3" strokeLinecap="round" /><Leaf x={50} y={50} rotate={-5} /><Leaf x={50} y={34} rotate={90} scale={.8} /><Leaf x={50} y={91} rotate={-20} scale={1.2} />{[[-17, 7, -25], [16, -7, 25]].map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r} 50 62)`}><rect x="39" y="35" width="22" height="48" rx="11" fill="#f9d35d" stroke="#c79937" strokeWidth="2" />{Array.from({ length: 5 }, (_, j) => <path key={j} d={`M40 ${44 + j * 7}h20`} stroke="#e3ad3c" strokeWidth="1.7" />)}<path d="M46 36v43m8-43v43" stroke="#ffe895" strokeWidth="2" /><path d="M50 86C31 80 30 58 31 55c10 3 16 14 19 31 4-20 13-25 18-31 0 18-4 30-18 31Z" fill="#7fb54d" stroke="#4e883c" strokeWidth="2" /></g>)}</>}
    {crop === 'pumpkin' && <><path d="M48 50c-3-15 11-21 13-15" fill="none" stroke="#608842" strokeWidth="6" strokeLinecap="round" /><Leaf x={53} y={47} rotate={85} scale={.9} /><path d="M44 48C7 28 5 83 27 91c13 7 19 1 23 2 7 6 17 3 22-1 22 1 29-53 4-49-13-7-21 0-26 5Z" fill="#ef953d" stroke="#ad6731" strokeWidth="2" /><ellipse cx="37" cy="70" rx="17" ry="25" fill="#f8ab4d" stroke="#db8333" strokeWidth="2" /><ellipse cx="65" cy="70" rx="17" ry="25" fill="#ef953d" stroke="#d47a30" strokeWidth="2" /><ellipse cx="50" cy="71" rx="13" ry="26" fill="#ffb655" stroke="#dd8935" strokeWidth="2" /><path d="M38 53q-10 5-10 18" fill="none" stroke="#ffd17d" strokeWidth="4" strokeLinecap="round" /></>}
    {crop === 'grapes' && <><path d="M50 92V31q10-18 21-14" stroke="#7e7140" strokeWidth="4" fill="none" /><path d="M53 35c-10-10-18-8-23-6" stroke="#6a8c43" strokeWidth="3" fill="none" /><path d="m38 32-17 3 4-10-9-8 12-3 4-13 10 11 13-1-3 12Z" fill="#76aa51" stroke="#4c843e" strokeWidth="2" /><path d="M61 27q18-17 15-7c-6 9-16 17-13 7" stroke="#70a54a" strokeWidth="2" fill="none" />{[[40, 48], [58, 46], [30, 61], [49, 61], [68, 60], [39, 75], [58, 75], [49, 87]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="11" fill={i % 2 ? '#9472bb' : '#aa89cd'} stroke="#765194" strokeWidth="1.7" /><ellipse cx={x - 3} cy={y - 4} rx="3.5" ry="2.6" fill="#d6b9e4" /></g>)}</>}
  </g>;
}
export function CropArt({ crop, stage = 2, className = '' }: { crop: CropId; stage?: number; className?: string }) {
  return <svg viewBox="0 0 100 110" className={`crop-icon ${className}`} aria-hidden="true"><CropDrawing crop={crop} stage={stage} /></svg>;
}
export function PlotArt({ crop, stage = 0, ready = false }: { crop?: CropId; stage?: number; ready?: boolean }) {
  return <svg viewBox="0 0 180 150" aria-hidden="true" className="plot-art">
    <path d="M13 61Q9 52 25 46L141 29q13-1 20 9l15 69q3 13-11 17L43 146q-12 1-18-10Z" fill="#719d44" opacity=".6" />
    <path d="M10 55q-3-10 12-12l119-17q13-1 18 10l16 66q3 11-11 14L42 138q-12 1-17-10Z" fill="#805333" />
    <path d="M13 49q-2-7 10-9l119-17q10-1 14 8l15 64q2 10-9 12L42 130q-10 1-14-9Z" fill="#a57344" stroke={ready ? '#f5d565' : '#795033'} strokeWidth={ready ? 3 : 2} />
    {[0, 1, 2, 3].map(i => <path key={i} d={`M${30 + i * 5} ${61 + i * 16}q40-11 117-18`} stroke="#805735" strokeWidth="5" strokeLinecap="round" opacity=".6" />)}
    <path d="m26 49 112-17" stroke="#c69961" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="40" cy="113" rx="3" ry="2" fill="#d0ac78" /><ellipse cx="147" cy="45" rx="4" ry="2" fill="#ccaa76" />
    {crop && <g className={ready ? 'mature-crops' : ''}>{[[36, -5, .56], [86, -12, .56], [48, 31, .6], [101, 19, .6]].map(([x, y, scale], i) => <g key={i} transform={`translate(${x} ${y}) scale(${scale})`} style={{ animationDelay: `${i * -.7}s` }}><CropDrawing crop={crop} stage={stage} /></g>)}</g>}
  </svg>;
}

export function Hamster({ kind = 'pip', pose = 'idle', className = '' }: { kind?: 'pip' | 'brutus' | 'guard'; pose?: string; className?: string }) {
  const bandit = kind === 'brutus', guard = kind === 'guard';
  const fur = bandit ? '#795344' : '#eab25d', light = bandit ? '#b99173' : '#ffe4ad', dark = '#594130';
  return <svg viewBox="0 0 150 160" className={`hamster ${kind} pose-${pose} ${className}`} aria-hidden="true">
    <ellipse cx="77" cy="147" rx="49" ry="9" fill="#486e35" opacity=".2" />
    {bandit && <g className="loot-sack"><path d="m113 72 17-9-3 22c34 26 21 61-8 58-30-3-31-32-8-56Z" fill="#be9a62" stroke="#7b5d3b" strokeWidth="3" /><path d="m110 88 20-6m-6 30-9 7 10 9" fill="none" stroke="#907140" strokeWidth="3" /><path d="m114 73 13 9" stroke="#e0c48e" strokeWidth="3" /></g>}
    <g className="foot foot-left"><ellipse cx="49" cy="141" rx="17" ry="10" fill={fur} stroke={dark} strokeWidth="2.5" /><path d="M41 143v3m7-3v3" stroke={dark} strokeWidth="1.5" /></g>
    <g className="foot foot-right"><ellipse cx="100" cy="141" rx="17" ry="10" fill={fur} stroke={dark} strokeWidth="2.5" /><path d="M101 143v3m7-3v3" stroke={dark} strokeWidth="1.5" /></g>
    <g className="hamster-body"><ellipse cx="75" cy="102" rx="47" ry="44" fill={fur} stroke={dark} strokeWidth="2.5" /><ellipse cx="75" cy="111" rx="30" ry="30" fill={light} />
      {!bandit && <><path d="M43 98q32 14 64 0l-5 38q-27 16-54 0Z" fill={guard ? '#73864b' : '#79a9a0'} stroke={guard ? '#536b39' : '#4e827c'} strokeWidth="2" /><path d="m49 92 5 28m44-28-5 28" stroke={guard ? '#b3b76b' : '#b8d4c1'} strokeWidth="7" /><rect x="61" y="113" width="28" height="17" rx="5" fill={guard ? '#8b9b57' : '#63928d'} /><circle cx="54" cy="109" r="3" fill="#ffda7c" /><circle cx="95" cy="109" r="3" fill="#ffda7c" /></>}
      <g className="paw paw-left"><ellipse cx="32" cy="105" rx="12" ry="19" transform="rotate(23 32 105)" fill={fur} stroke={dark} strokeWidth="2.3" /></g><g className="paw paw-right"><ellipse cx="117" cy="104" rx="12" ry="19" transform="rotate(-23 117 104)" fill={fur} stroke={dark} strokeWidth="2.3" /></g>
      <circle cx="40" cy="35" r="20" fill={fur} stroke={dark} strokeWidth="2.5" /><circle cx="111" cy="35" r="20" fill={fur} stroke={dark} strokeWidth="2.5" /><circle cx="40" cy="35" r="12" fill="#e6a49a" /><circle cx="111" cy="35" r="12" fill="#e6a49a" />
      <path d="M31 47q10-21 44-21t44 21c8 10 15 32 7 46-12 18-85 24-102-2-8-14-2-34 7-44Z" fill={fur} stroke={dark} strokeWidth="2.5" /><path d="M31 66q13-10 22 3c12 18 32 18 44 0 11-13 24-4 26 9 5 32-96 38-96 3Z" fill={light} />
      {bandit && <path d="M35 53q17-10 40 0 25-9 41 0l-2 21q-16 8-39-3-23 13-39 1Z" fill="#413b35" />}
      <g className="hamster-eyes"><ellipse cx="54" cy="62" rx="4.8" ry="6.5" fill="#3f352a" /><ellipse cx="96" cy="62" rx="4.8" ry="6.5" fill="#3f352a" /><circle cx="55" cy="60" r="1.7" fill="#fff5db" /><circle cx="97" cy="60" r="1.7" fill="#fff5db" /></g>
      {bandit && <path d="m45 48 15 5m28 0 15-5" stroke="#342e29" strokeWidth="5" strokeLinecap="round" />}
      <ellipse cx="40" cy="79" rx="11" ry="7" fill="#ec9b86" opacity=".9" /><ellipse cx="110" cy="79" rx="11" ry="7" fill="#ec9b86" opacity=".9" />
      <path d="M68 76q7-6 14 0-1 8-7 8t-7-8" fill="#a66d56" /><path d={bandit ? 'M65 94q10-8 20 0M75 83v6' : 'M63 89q6 9 12 0 6 9 12 0M75 83v6'} fill="none" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />
      {!bandit && !guard && <g className="straw-hat"><ellipse cx="72" cy="29" rx="58" ry="12" fill="#efd083" stroke="#ac8141" strokeWidth="2.5" transform="rotate(-7 72 29)" /><path d="M36 28 42 9q22-14 51-2l12 17q-33 14-69 4Z" fill="#f8d887" stroke="#ac8141" strokeWidth="2.5" /><path d="M38 22q32 8 64-4l3 7q-35 13-69 4Z" fill="#b98350" /><path d="m50 10 3 9m13-13 1 13m14-12 4 11" stroke="#dfba6a" strokeWidth="2" /><path d="M99 19q9-18 17-12-3 13-16 15" fill="#70a35a" /></g>}
      {guard && <g><path d="M36 31q1-32 39-30 35 0 38 30Z" fill="#647d48" stroke="#425b36" strokeWidth="2.5" /><ellipse cx="77" cy="31" rx="48" ry="7" fill="#7f9458" stroke="#425b36" strokeWidth="2" /><path d="m74 9 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1Z" fill="#ffd571" /></g>}
      {bandit && <g><path d="M34 98q35 14 76-2l-1 13q-35 12-74-1Z" fill="#c95e50" stroke="#963f38" strokeWidth="2" /><path d="m101 106 27 19-22 1 4 14-19-29Z" fill="#de7560" stroke="#963f38" strokeWidth="2" /></g>}
    </g>
  </svg>;
}

export function WeaponArt({ slot, active = true }: { slot: number; active?: boolean }) {
  return <svg viewBox="0 0 130 155" aria-hidden="true" className={`weapon-art ${active ? '' : 'unbuilt'}`}>
    <ellipse cx="65" cy="143" rx="48" ry="10" fill="#4e6f36" opacity=".22" />
    {slot === 0 && <><path d="m32 140 33-45 32 45Z" fill="#a77c49" stroke="#795b37" strokeWidth="3" /><path d="M65 127V67C36 64 29 46 28 29l13-3c3 18 8 24 23 24 17 0 21-9 22-24l14 2c-1 22-7 36-27 40v59Z" fill="#bd935b" stroke="#805a37" strokeWidth="3" /><path d="m34 29 31 48 30-49" fill="none" stroke="#7d4c39" strokeWidth="5" /><ellipse cx="65" cy="77" rx="11" ry="7" fill="#ead59d" stroke="#a27846" strokeWidth="2" /><path d="m48 122 26 1" stroke="#e0b77a" strokeWidth="4" strokeLinecap="round" /><path d="M94 136q0-17 13-17t13 17Z" fill="#d7b77e" stroke="#9b7d4c" strokeWidth="2" /></>}
    {slot === 1 && <><path d="M39 142 46 66h13l-5 76m23 0-5-76h13l8 76" fill="#a27a48" stroke="#715535" strokeWidth="3" /><path d="m48 106 36 27m-34 0 32-26" stroke="#c4975b" strokeWidth="5" /><path d="M32 64h66v27H32Z" fill="#c89c5f" stroke="#805f3d" strokeWidth="3" /><path d="M32 74h66M42 65v26m45-26v26" stroke="#a07849" strokeWidth="2" /><g transform="translate(30 10) scale(.46)"><Hamster kind="guard" /></g><path d="m24 33 39-27 43 27Z" fill="#7c995a" stroke="#4f6c40" strokeWidth="3" /><path d="m32 26 29-18" stroke="#9cb478" strokeWidth="3" /><path d="M29 34v27m71-27v27" stroke="#805f3d" strokeWidth="5" /></>}
    {slot === 2 && <><circle cx="42" cy="126" r="18" fill="#946b42" stroke="#674b32" strokeWidth="3" /><circle cx="88" cy="126" r="18" fill="#946b42" stroke="#674b32" strokeWidth="3" /><circle cx="42" cy="126" r="7" fill="#e0ba73" /><circle cx="88" cy="126" r="7" fill="#e0ba73" /><path d="M38 115h55L75 90H53Z" fill="#8ca258" stroke="#557d40" strokeWidth="3" /><path d="M52 99 33 66l54-31 25 37-47 29Z" fill="#e7b74d" stroke="#a47734" strokeWidth="3" /><path d="m45 69 50-29m-44 40 49-29" stroke="#f6d476" strokeWidth="4" /><g transform="translate(93 55) rotate(-30)">{Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx="0" cy="-22" rx="8" ry="15" fill="#f9d566" stroke="#bd943c" strokeWidth="1.5" transform={`rotate(${i * 40})`} />)}<ellipse rx="16" ry="24" fill="#7a5b31" stroke="#aa7c35" strokeWidth="3" /><ellipse rx="9" ry="16" fill="#4e4c2d" /></g></>}
  </svg>;
}

function Tree({ x, y, scale = 1, variant = 0 }: { x: number; y: number; scale?: number; variant?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="14" rx="63" ry="18" fill="#527d39" opacity=".23" /><path d="M-12 13-8-87h20l3 100Z" fill="#987143" stroke="#705b36" strokeWidth="3" /><path d="m0-53-28-29m30 9 27-28" stroke="#987143" strokeWidth="11" strokeLinecap="round" />
    <path d="M-64-69c-27-28-7-71 17-72-6-43 53-58 73-30 34-10 61 17 51 46 41 16 27 72-8 73-32 21-64 4-69-2-26 14-50 10-64-15Z" fill={variant ? '#86b45a' : '#70a950'} stroke="#568f43" strokeWidth="3" />
    <path d="M-58-104c-8-23 7-38 24-39 0-31 39-40 60-21 26-6 47 7 43 30-22-14-36-3-41 7-18-16-42-9-48 9-15-9-26-6-38 14Z" fill={variant ? '#a4c86a' : '#8ebd61'} />
    <path d="M-57-71q19 21 47 8m43 2q20 7 34-6" fill="none" stroke="#4f8e42" strokeWidth="7" strokeLinecap="round" />
    {variant === 1 && [[-40,-110],[20,-148],[52,-92],[-5,-82]].map(([a,b],i)=><g key={i}><circle cx={a} cy={b} r="9" fill="#eebf53" stroke="#cd983c" strokeWidth="1.5" /><ellipse cx={a-2} cy={b-3} rx="2.5" ry="2" fill="#ffe092" /></g>)}
    <path d="m-17 18 7-15m-3 17 10-14m18 14-5-12m16 9-7-7" stroke="#7dac4e" strokeWidth="4" strokeLinecap="round" />
  </g>;
}
function Flower({ x, y, scale = 1, color = '#fff1b4' }: { x: number; y: number; scale?: number; color?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M0 8V-4m0 9-6-5" stroke="#5b9343" strokeWidth="2" strokeLinecap="round" />{Array.from({length:5},(_,i)=><ellipse key={i} cy="-7" rx="3" ry="5" transform={`rotate(${i*72} 0 -3)`} fill={color} />)}<circle cy="-3" r="3" fill="#e3af40" /></g>;
}
function Fence({ x, y, length, reverse = false }: { x: number; y: number; length: number; reverse?: boolean }) {
  return <g transform={`translate(${x} ${y}) ${reverse ? 'scale(-1 1)' : ''}`}><path d={`M0-20H${length}M0 0H${length}`} stroke="#a58d52" strokeWidth="10" strokeLinecap="round" /><path d={`M0-22H${length}M0-2H${length}`} stroke="#d6c18b" strokeWidth="6" strokeLinecap="round" />{Array.from({length:Math.floor(length/56)+1},(_,i)=><g key={i} transform={`translate(${i*56} 0)`}><path d="M-7 15v-52l7-8 7 8v52Z" fill="#ecd8a0" stroke="#ad935a" strokeWidth="2" /><circle cy="-20" r="2" fill="#a28b58" /><circle r="2" fill="#a28b58" /></g>)}</g>;
}
export function FarmWorld() {
  return <svg className="world-art" viewBox="0 0 1200 790" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x2="0" y2="1"><stop stopColor="#f4edbb" /><stop offset="1" stopColor="#eaf0bd" /></linearGradient>
      <linearGradient id="grass" x2=".2" y2="1"><stop stopColor="#b8ce73" /><stop offset=".52" stopColor="#a2c165" /><stop offset="1" stopColor="#83b558" /></linearGradient>
      <radialGradient id="sunwash"><stop stopColor="#fff1b5" stopOpacity=".6" /><stop offset="1" stopColor="#fff1b5" stopOpacity="0" /></radialGradient>
      <linearGradient id="roof" x2="0" y2="1"><stop stopColor="#dd9863" /><stop offset="1" stopColor="#bc744b" /></linearGradient>
      <pattern id="grass-specks" width="104" height="87" patternUnits="userSpaceOnUse"><path d="m17 35 3-7 3 6m52 41 2-8 4 5m12-60 3-5" fill="none" stroke="#6c9f4d" strokeWidth="2" strokeLinecap="round" opacity=".35" /><ellipse cx="46" cy="16" rx="3" ry="1.5" fill="#d4dc8c" opacity=".6" /></pattern>
    </defs>
    <rect width="1200" height="790" fill="url(#sky)" />
    <g className="clouds" fill="#fff8d9" opacity=".8"><path d="M36 66q-2-20 20-20 8-25 35-17 20-5 27 14 27-1 25 22Z" /><path d="M518 61q-7-15 13-20 6-29 35-18 19-2 26 14 30-5 27 22Z" /><path d="M1011 37q0-18 21-17 10-17 29-8 16-1 18 13 20-3 22 12Z" /></g>
    <circle cx="1020" cy="76" r="41" fill="#f9d77b" /><circle cx="1020" cy="76" r="53" fill="#ffdd83" opacity=".2" />
    <path d="M0 154Q120 56 283 147 438 65 605 145 818 50 1022 128q100-76 178-30v692H0Z" fill="#c5d68b" />
    <path d="M0 204Q174 122 332 182 511 106 695 174 875 112 1056 177q100-62 144-27v640H0Z" fill="#abc473" />
    <path d="M0 252Q171 188 350 224 601 187 808 219q255-65 392-9v580H0Z" fill="url(#grass)" />
    <rect y="240" width="1200" height="550" fill="url(#grass-specks)" />
    <path d="M232 241c-7 55 41 74 40 124-3 61-62 132-14 184 72 79 341 54 414 71 125 31 135 107 352 117l176 1v52h-95c-177-4-263-28-318-62-73-44-79-61-203-58-199 6-355-11-401-70-56-74 42-166 38-226-3-46-51-67-36-133Z" fill="#d7c38c" />
    <path d="M232 249c-7 55 48 70 48 119-2 57-59 134-15 175 78 74 345 53 414 74 142 44 148 104 335 112" fill="none" stroke="#e5d49f" strokeWidth="25" opacity=".8" />
    <ellipse cx="664" cy="452" rx="400" ry="193" fill="#9bbb5d" opacity=".7" />
    <path d="M306 312q30-24 81-23l594-3q45 1 54 35l15 225q-2 54-53 62l-633 16q-53-4-57-50Z" fill="#b9c976" opacity=".7" />
    <Fence x={323} y={293} length={700} />
    <g transform="translate(123 103)">
      <ellipse cx="125" cy="184" rx="122" ry="23" fill="#6d9551" opacity=".4" />
      <path d="M28 64h172v113q-82 26-166 2Z" fill="#deb77a" stroke="#967246" strokeWidth="3" /><path d="M32 76h164m-164 23h164m-164 23h164m-164 24h164m-164 22h164" stroke="#c89e64" strokeWidth="2" />
      <path d="M168 24V-6h21v44Z" fill="#a77c54" stroke="#825f41" strokeWidth="3" /><path d="M164-7h28v9h-28Z" fill="#bd9670" /><g className="chimney-smoke" fill="#fff5d8" opacity=".45"><ellipse cx="177" cy="-20" rx="9" ry="6" /><ellipse cx="184" cy="-38" rx="14" ry="9" /></g>
      <path d="M3 76 105-3q12-9 24 0l96 69q11 10-3 18L117 24 13 89Z" fill="url(#roof)" stroke="#8b6242" strokeWidth="3" /><path d="M16 72 112 4q7-5 12 0l88 63" fill="none" stroke="#edb47d" strokeWidth="6" strokeLinecap="round" />
      {[0,1,2,3].map(i=><path key={i} d={`m${24+i*18} ${65-i*12} 94 2 80 49`} fill="none" stroke="#aa6846" strokeWidth="2" opacity=".6" />)}
      <path d="M88 180V108q0-18 24-19t24 18v79" fill="#956b45" stroke="#77583a" strokeWidth="3" /><path d="M96 181v-74q16-20 32 0v78" fill="#b18754" /><path d="M108 99v80m12-79v82" stroke="#9f764c" strokeWidth="2" /><circle cx="125" cy="143" r="3" fill="#eaca83" />
      <g fill="#c4d6b0" stroke="#8a7049" strokeWidth="3"><rect x="44" y="98" width="29" height="35" rx="8" /><rect x="152" y="98" width="29" height="35" rx="8" /></g><path d="M59 98v35m-15-18h29m93-17v35m-14-18h29" stroke="#f2dca5" strokeWidth="3" />
      <g fill="#ad8051" stroke="#87683f" strokeWidth="2"><path d="M39 132h39v11H39Z" /><path d="M147 132h39v11h-39Z" /></g>
      {[44,56,68,153,165,177].map((x,i)=><Flower key={i} x={x} y={130} scale={.8} color={i%2?'#f5d76e':'#ed9b86'} />)}
      <path d="M86 184h56v11H84Z" fill="#c4b282" stroke="#a28d5d" strokeWidth="2" />
      <g transform="translate(3 149)"><ellipse cx="15" cy="32" rx="20" ry="6" fill="#6f8f45" opacity=".3" /><path d="m-1 4 4 27q13 5 25-1l3-26Z" fill="#bc8458" stroke="#97643e" strokeWidth="2" /><path d="M2 7h25" stroke="#e1ab73" strokeWidth="3" />{[0,1,2].map(i=><Flower key={i} x={5+i*10} y={0} scale={1.2} color="#f6cd63" />)}</g>
    </g>
    <g transform="translate(876 144)"><ellipse cx="74" cy="133" rx="112" ry="21" fill="#74954a" opacity=".3" /><path d="M-5 36v88m160-88v88" stroke="#927048" strokeWidth="7" /><path d="M-20 43 2 0h129l35 43Z" fill="#f7dea0" stroke="#a3844a" strokeWidth="3" /><path d="M15 0 0 43h28L37 0m28 0-3 43h30L88 0m29 0 14 43h31L135 0" fill="#d59171" /><path d="M-20 43v12q12 14 26 0 13 14 27 0 15 14 30 0 13 14 27 0 15 14 29 0 15 14 30 0 13 13 18 0V43" fill="#e9c285" stroke="#a3844a" strokeWidth="2" /><path d="M-12 97h175v28H-12Z" fill="#c49a60" stroke="#8e6c43" strokeWidth="3" /><path d="M-7 111h164M3 126v13m147-13v13" stroke="#9b7748" strokeWidth="3" /><g transform="translate(-5 40) scale(.53)"><CropDrawing crop="carrot" /></g><g transform="translate(42 44) scale(.5)"><CropDrawing crop="strawberry" /></g><g transform="translate(93 42) scale(.5)"><CropDrawing crop="pumpkin" /></g><path d="m53 111 41 1 1 28-41-1Z" fill="#678061" stroke="#496648" strokeWidth="2" /><text x="75" y="130" textAnchor="middle" fill="#fff0c7" fontSize="16" fontFamily="Nunito" fontWeight="900">MARKET</text></g>
    <Tree x={60} y={312} scale={1.35} /><Tree x={1127} y={313} scale={1.35} variant={1} />
    <g fill="#6f9d47"><ellipse cx="53" cy="390" rx="95" ry="52" /><ellipse cx="-5" cy="458" rx="87" ry="83" /><ellipse cx="1180" cy="486" rx="72" ry="65" /></g>
    <g fill="#84ae52"><ellipse cx="43" cy="367" rx="75" ry="40" /><ellipse cx="-9" cy="435" rx="67" ry="63" /><ellipse cx="1192" cy="463" rx="65" ry="44" /></g>
    <Tree x={102} y={682} scale={1.5} variant={1} /><Tree x={1159} y={731} scale={1.7} />
    <Fence x={315} y={637} length={310} /><Fence x={924} y={634} length={140} />
    <g transform="translate(212 611) rotate(-6)"><path d="M25 0v92" stroke="#8f7043" strokeWidth="10" /><path d="M-29-8h112l9 27-9 26H-29Z" fill="#cca76a" stroke="#8f7043" strokeWidth="3" /><path d="M-23-2h101" stroke="#e7c78b" strokeWidth="3" /><text x="28" y="15" textAnchor="middle" fontFamily="Lilita One" fontSize="17" fill="#755333">PIP’S</text><text x="28" y="34" textAnchor="middle" fontFamily="Lilita One" fontSize="17" fill="#755333">PATCH</text><circle cx="-19" cy="17" r="2" fill="#88653e" /><circle cx="76" cy="17" r="2" fill="#88653e" /></g>
    {Array.from({length:45},(_,i)=><Flower key={i} x={30+(i*137%1140)} y={270+(i*71%480)} scale={.6+(i%3)*.2} color={['#fff3c4','#efb4a4','#ead27d'][i%3]} />)}
    <g fill="#a6be68"><path d="M0 741q64-44 134-5 59-53 139 4 108-34 172 50H0Z" /><path d="M871 790q41-78 126-54 65-60 127-10 43-21 76 9v55Z" /></g>
    <g fill="#8fb25a"><ellipse cx="-8" cy="785" rx="95" ry="55" /><ellipse cx="1169" cy="795" rx="100" ry="49" /></g>
    <circle cx="925" cy="120" r="550" fill="url(#sunwash)" pointerEvents="none" />
    <g className="drifting-leaf" transform="translate(760 236)"><path d="M0 11C-14-2-3-21 13-24 24-5 15 10 0 11Z" fill="#dbbd66" stroke="#b29c50" strokeWidth="1.5" /><path d="m-3 17 13-34M3 6l9-4M5-1 1-7" stroke="#a48b44" strokeWidth="1.5" fill="none" strokeLinecap="round" /></g>
  </svg>;
}
export const positionStyle = (x: number, y: number): CSSProperties => ({ left: `${x / 12}%`, top: `${y / 7.9}%` });
