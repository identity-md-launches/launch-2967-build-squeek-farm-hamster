# Squeek Farm design system

## Overview

Squeek Farm is a friendly, single-player farming and defense game. The visual idea is a sunlit miniature farm inhabited entirely by hamsters: round characters, soft wooden buildings, patterned soil, hand-shaped foliage, and warm paper controls. The playable world is the main surface. Shops and explanations are disclosed in dialogs instead of competing with the farm.

The implementation lives in `src/style.css`, `src/art.tsx`, and `src/App.tsx`. All illustrations are original vector geometry; no emoji, stock illustration, external image service, or copied Farm Frens assets are used. Farm Frens informed the cozy atmosphere only.

## Colors

UI tokens are declared at the top of `src/style.css`. The canonical format is hex, shared with the SVG illustration palette.

| Semantic token | Value | Use |
| --- | --- | --- |
| `--color-page` | `#f6f3e6` | Warm paper page |
| `--color-surface` | `#fcfaef` | Farm dock and dialog paper |
| `--color-surface-inset` | `#eee7ce` | Neutral button and inset surfaces |
| `--color-text` | `#35452c` | Primary olive text |
| `--color-text-secondary` | `#475c38` | Supporting labels and prose |
| `--color-accent` | `#f5ce61` | Primary purchase/play action |
| `--color-accent-pressed` | `#eab849` | Gold accent ramp |
| `--color-focus` | `#285f72` | Three-pixel keyboard outline |
| `--color-border` | `#d9d4b8` | Quiet dashed dividers |
| `--color-success` | `#426637` | Owned/installed states |

The primitive cream, olive, and gold variables feed the semantic tokens. Illustration colors belong to the artwork: grass ranges from `#83b558` to `#b8ce73`, crop colors distinguish species, and Pip’s gold fur, teal overalls, and Brutus’s red scarf establish character identity. The title ribbon is `#9b5837` with `#fff6d9` lettering. Selected seeds use `#f5e5ad`; seed metadata is `#586044`. Raids use a peach surface `#f5d5b5` with dark text `#7e432d`, reinforced by a shield and an explicit warning.

There is one light theme. Do not infer a dark theme or reuse crop category colors to imply actions. Text on real solid backgrounds is measured in validation; text over the SVG landscape and outlined logo lettering are not covered by the probe’s solid-background contrast calculation.

## Typography

- **Nunito**, locally bundled Latin faces at 400, 700, and 900, with `sans-serif` fallback. Root UI weight is 700; supporting paragraphs use 400 and action labels/strong data use 900.
- **Lilita One**, locally bundled at 400, with `sans-serif` fallback, for headings, the logo, and prominent GOLD totals. Do not request a synthetic bold face.
- UI scale: `--text-xs` 12 px, `--text-sm` 14 px, `--text-body` 16 px, `--text-lg` 20 px, `--text-heading` 28 px, and `--text-display` 48 px. Values are expressed in rem.
- Paragraph line height is 1.55; headings use 1.1, and short small labels use at least 1.2. Dialog descriptions stay near 60 characters per line.
- Headings balance their wrapping; body descriptions use `text-wrap: pretty`. Timers, balances, prices, and ledger figures use tabular numerals.
- The welcome logo is outlined SVG artwork inside an accessibly named `h1`. Its two text shapes use a 110/165-unit illustration scale, independent of the six UI sizes. The compact header wordmark uses normal text.

Font imports are in `src/main.tsx`; the production build bundles the required files. Font licenses are in `public/licenses/`. The final browser probe confirmed the two families and three weights. No remote font request is needed.

## Layout

The page is centered at a maximum 1600 px, with 4.2% outer padding. Controls follow a small 4/8/12/16/24 px spacing rhythm. The header is 96 px tall on desktop and 76 px on phones; the brand stays at the leading edge and utilities at the trailing edge.

Above 900 px, the game uses `minmax(0, 1fr)` for the world and a 272 px seed shed, separated by 24 px. Below 1150 px the shed narrows to 242 px. At 900 px and below, the shed follows the farm, with six seeds in a row when space permits. At 600 px and below, the shed uses a three-column, two-row layout with vertically arranged crop art and unbroken names. Phone page margins are 16 px, reducing to 12 px at 360 px.

The world uses one 1200 × 790 coordinate system for scenery, plots, Pip, Brutus, and weapons. Farm positions are exported from `src/game.ts`; `positionStyle` in `src/art.tsx` converts them into percentages. On phones the view is cropped to a 1000 × 790 field of view: `.world-inner` becomes 120% wide and starts at −14%. This trims decorative edges while retaining all eight plots and all three weapon slots. The crop targets remain native buttons with comfortable touch dimensions.

The action dock always follows the field in normal flow. It does not cover the art or page content. At 390 px, the playable field and primary actions are on the first screen. The welcome screen also keeps Play now visible without scrolling. Dialogs are centered on desktop and become bottom sheets on phones; long shops scroll within a maximum 92dvh. Insets respect the page edges, and the footer includes safe-area padding.

Observed production widths are 320, 390, 768, and 1440 CSS pixels. No horizontal overflow was found. Physical-device rendering and native browser zoom were not verified.

## Elevation & depth

The farm is layered scenery, rather than a stack of generic cards. SVG shadows are painted ellipses and darker soil edges. Native controls use shallow, warm contact shadows: primary buttons have a four-pixel gold base and a light inset highlight; the selected seed has a two-pixel selection ring. Dashed lines organize market rows and ledger figures without boxing every item.

The board has a four-pixel paper base shadow. Dialogs use a broad `0 20px 90px #263b3155` shadow with a dark translucent, blurred backdrop. Modal content sits in the browser’s top layer. Farm layers are scenery, plots, defenses, hamsters, effects, and pause/celebration overlays in ascending order. Decorative effects use `pointer-events: none`.

## Shapes

Use rounded, slightly irregular SVG geometry for the world. Soil beds are tapered, tilted paths with furrows and pebbles, not plain rectangles. Hamsters have overlapping circular cheeks, oval paws, and rounded accessories. Each crop has a sprout, a smaller young plant, and a mature species-specific illustration.

Controls use 10–24 px rounding: primary buttons use the 16 px medium radius, the board uses the 24 px large radius, mobile seeds use 13 px, and the title farm uses 30 px on desktop / 23 px on phones. Dialogs use 26 px on desktop and 23 px top corners on phones. Shape and border changes communicate selection and ownership; they are not purely decorative.

## Components

| Component or pattern | Source | Behavior |
| --- | --- | --- |
| `Icon` | `src/art.tsx` | Original rounded SVG symbols, currentColor and 1.8-unit strokes; decorative inside labeled controls |
| `CropDrawing` / `CropArt` / `PlotArt` | `src/art.tsx` | Six crop species, three stages, patterned soil, mature yield state |
| `Hamster` | `src/art.tsx` | Pip, Brutus, and guard variants; idle/walk/plant/harvest/sneak poses |
| `WeaponArt` | `src/art.tsx` | Three weapon silhouettes matched to fixed slots |
| `.plot` | `src/App.tsx`, `src/style.css` | Native button; empty/young/ripe states, free planting, timed growth, single harvest; descriptive dynamic accessible name |
| `.seed-choice` | Same | Selectable unlocked seed, locked seed that opens the market, checked selection marker |
| `.action-dock` | Same | Stable action names, redundant count badges, pressed state for planting/harvesting |
| `.basket-summary` | Same | Always-visible inventory count and sell value; opens Market |
| `Modal` | `src/App.tsx` | Native dialog, background inertness, initial focus, Tab/Shift+Tab wrap, Escape/backdrop close, explicit trigger focus return |
| `PurchaseButton` / `Gold` | `src/App.tsx` | Consistent integer prices, disabled unaffordable state with visible shortfall, installed state |
| `.farm-status` / `.feedback-strip` | Same | Protection countdown, urgent raid warning, stable polite action feedback |
| `.chain-button` / `.sunshine-active` | Same | Checking, verified spinning, verified resting, or Offline; spinning bonus explicitly named |
| `Confetti` | `src/App.tsx` | Noninteractive celebration visible on both the farm and active shop |

Buttons have hover treatment only on hover-capable devices, tactile 0.96 press feedback, a visible focus ring, and genuine disabled states. Primary transactions use gold fill; secondary actions use paper. Unaffordable controls explain the missing GOLD next to the purchase. Errors remain visible until dismissed. Inventory never pretends to be global or on-chain.

Motion is opt-in under `prefers-reduced-motion: no-preference`. Walking paws, planting gestures, crop sway, drift, harvest sparkles, seed attacks, and expansion confetti have named, limited animation rules. State transitions name their properties rather than using `transition: all`. Reduced motion stops all endless CSS animations and removes the purely decorative projectile and harvest bursts. Gameplay timing and static state labels remain available.

## Do’s and don’ts

- Reuse the existing paper, olive, and gold roles and the six UI sizes. Keep crop color in the illustration layer.
- Add farm entities in the shared coordinate system, with a native labeled control when interactive. Decorative SVG layers must not swallow input.
- Keep transactional handlers in the game engine and preserve the GOLD invariant. UI animations never grant rewards or resolve theft.
- Use `Modal` for additional shop/help content so keyboard containment and focus return remain consistent.
- Keep the product and main action above secondary explanations on phones. Do not introduce a marketing page between Play now and the farm.
- Never substitute sample wheel activity, a random “live” status, a wallet requirement, or real-token wording.

For another view, start from the existing header/content/footer shell, use the same type and surface tokens, and disclose optional detail in the existing dialog pattern. Avoid adding another font, radius system, or generic dashboard card grid.

Design guidance was adapted from Jakub Krehel’s **Better Interface** (MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`); documentation guidance was adapted from Paul Bakaus’s **Impeccable** (Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). Notices and license texts are preserved in `docs/design-guidance-LICENSE`.
