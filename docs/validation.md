# Delivery validation

Validated on 2026-11-04 against the production export in `dist/`. These are worker-run checks, not an independent certification of gameplay, accessibility, or blockchain facts.

## Scope and assumptions

The deliverable is one static, single-player React/TypeScript game. All progression, inventory, and GOLD statistics belong to one browser save. Starting GOLD is zero; free planting provides the path to the first sale. The farm is original SVG art with native HTML controls over one shared coordinate system. No wallet, backend, shared economy, PvP, real-token contract, or offline theft is present.

The exported site was served at `/preview/index.html` to check gateway-subpath behavior. Chromium exercised real production JavaScript and assets. Controlled API responses were used only in tests, with separate spinning, stale, service-error, and network-failure scenarios. Production always requests the real documented public endpoint. Public hosting and its URL are assigned by the network after review.

## Requirements reviewed

| Area | Result | Evidence |
| --- | --- | --- |
| Playable farming/defense game | Met | Full browser progression from Play now through farming, trade, expansions, and defenses |
| Original colorful cartoon artwork | Met | `src/art.tsx`; inspected title, populated farm, characters, crops, and weapons |
| Pip and Brutus, both hamsters | Met | Hat/cheeks/overalls and scarf/sack variants, movement and interaction poses; guard is also a hamster |
| Four starting plots, two expansions, three slots | Met | Initial and expanded farm screenshots; native controls add plots up to eight |
| GOLD, inventory, chain status and six action buttons | Met | Balance HUD, permanent basket summary, honest wheel status, working dock |
| Six crops, exact times/yields/prices, three stages | Met | Parameterized engine tests plus browser stage assertions for all six species |
| Initial seeds and paid unlocks, free planting | Met | Rejected locked planting; actual UI unlock and crop progression |
| Individual crop sales and sell-all | Met | Sell one, sell one crop’s stock, and sell basket; repeat-sale rejection |
| Expansion costs 100 / 250; maximum eight | Met | Engine and browser assertions, visible usable farmland |
| Beginner protection and scheduled raids | Met | 90 active seconds, then 90–150 active-second scheduling, ripe-target guard |
| Theft only on escape; maximum four; safe stock/GOLD | Met | Approach/escape checks, targeted harvest rescue, repeated-raid yield bounds |
| All three automatic weapons | Met | Separate range/cooldown/interception engine cases; visible purchases and rendered defense interception |
| 80/20 burn/treasury and balanced supply | Met | Integer purchase cases, 3,000 mixed actions, actual Economy dialog |
| Authentic Squeekchain API and capped Sunshine | Met | Official endpoint/field verification, live public response, strict parser and controlled browser cases |
| Failure/staleness fallback, no fabricated live state | Met | Offline UI and base growth; unknown/simulated/malformed data rejected |
| Local saves and offline maturation | Met | Reload restoration, bounded progress, no repeated rewards or offline raids |
| Mobile/desktop interaction and feedback | Met | 320/390/768/1440 layouts, all shops, pause, help, sounds, harvest/defense feedback |
| Static export, source, lockfile, metadata and docs | Met | Vite relative base, local asset integrity, title/favicon/description/social PNG, source and documentation |
| Deployed public URL | After review | No publication action performed; complete `dist/` supplied |

No requested gameplay system is knowingly incomplete. Aesthetic judgments are supported by the saved screenshots and actual source, rather than the structural verifier alone.

## Commands and actual results

| Check | Actual result |
| --- | --- |
| `npm install --no-audit --no-fund` | Completed; normal dependencies and lockfile created |
| `npm run typecheck` | Exit 0 |
| `npm run build` | Exit 0; 36 modules transformed; complete relative static export |
| `npm test` | Exit 0; 27 tests passed, including 3,000 mixed actions |
| `scripts/browser-check.mjs` against the built export | Exit 0; 13 scenario groups passed; no uncaught script errors or failed local resources |
| `scripts/accessibility-check.mjs` against the built export | Exit 0; keyboard primary flow, modal loop/return, rendered focus/contrast/targets, reduced motion, and save-error states passed |
| Pinned `taste.mjs --out test/scratch/taste` | Exit 0; 16/16 checks passed |
| Original share SVG → PNG render | Exit 0; 1200 × 630 PNG verified from its bytes |
| Local export-reference check | All relative HTML and CSS asset references resolve; social PNG dimensions verified |
| `git check-ignore -v dist/index.html` | Printed nothing; exit 1 means the export is not ignored |
| Submission path/size check | Under the 8,388,608-byte limit; no dependency/cache paths, `.env`, archives, or submodules added |

The browser checks used the supplied toolchain, selected with:

```sh
PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright node scripts/browser-check.mjs --playwright=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs
PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright node scripts/accessibility-check.mjs --playwright=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs
IMD_PLAYWRIGHT=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

Both delivered browser scripts own and close their server and browser. They use simulated time, not long real waits. Temporary machine-readable results and additional screenshots live under `test/scratch/`, which is intentionally disposable. The pinned probe is an assignment input and is not required to rebuild the site.

The public endpoint `https://api.squeekchain.com/v1/status` returned HTTP 200 and `Access-Control-Allow-Origin: *` during verification. The returned schema and wheel measurement fields matched the [official API reference](https://docs.squeekchain.com/developers/api/). No private endpoint, credentials, or wallet configuration is used or distributed.

## Better Interface coverage

| Domain | Coverage | Evidence and limits |
| --- | --- | --- |
| Accessibility | Checked | Native buttons/dialogs, readable names, keyboard Enter/Space plant/harvest/sale, 18 Tab steps contained in Market, Escape and trigger return, visible 3 px focus ring, live feedback, disabled/owned states, storage-error recovery, reduced motion. Screen-reader and forced-colors sessions were not performed. |
| Layout | Checked | Production title/farm/shops at 320, 390, 768, and 1440; no horizontal overflow; primary action on first phone screen; all six seed labels on one line at 390; dialogs remain within viewport. Native 200% browser zoom, physical devices, translated strings, and an RTL mirror were not tested. English is the implemented locale. |
| Writing | Checked | Buttons match their actions, crop/stock/prices and purchase shortfalls are explicit, empty farm gives planting directions, offline data is described honestly, local GOLD is distinguished from real tokens. Redundant slogans were removed while retaining the requested tagline. |
| Typography | Checked | Two locally loaded families, three weights, six UI sizes; numeric alignment and wrapping inspected. The probe reports five sizes including one-offs on desktop, three on the phone title. SVG lettering is separate artwork. |
| Colors | Checked | Final probe passes measured text contrast; five gameplay solid-background pairs measured in Chromium. Status uses text/icons as well as color. Outlined SVG lettering and arbitrary text over illustrated/alpha backgrounds were not exhaustively pixel-audited. One light theme only. |
| UI | Checked | Rest/hover/focus/press/disabled/locked/owned/growing/ripe/raid/offline states; dialogs, basket, optional sound and transaction feedback; source review of attack and celebration effects; zero endless animations under reduced motion. Motion was not replayed at 10% speed in DevTools. |

Six-domain review supplements the build and interaction tests; it does not imply a full accessibility conformance audit.

### Measured gameplay results

At 390 CSS pixels:

- Four plot targets were approximately **61.86 × 56.56 px**.
- Six dock targets were **56 × 69 px**.
- Six seed targets were approximately **112.66 × 100.19 px**.
- All sixteen of these primary game controls exceeded the 44 × 44 px comfort target. Smaller header/dialog utilities still meet the probe’s minimum target/spacing test.
- The focused plot matched `:focus-visible` with `3px solid rgb(40, 95, 114)` and was inspected in the saved keyboard screenshot.

Actual Chromium foreground/background pairs:

| Element | Foreground / solid background | Ratio |
| --- | --- | ---: |
| Header “farm” wordmark | `#80622d` / `#f6f3e6` | 5.10:1 |
| Selected seed timing | `#586044` / `#f5e5ad` | 5.26:1 |
| Farm status line | `#4b6237` / `#e6ebcc` | 5.52:1 |
| Empty plot action label | `#694e2b` / `#e8ce98` | 5.03:1 |
| Basket summary | `#35452c` / `#ece6ce` | 8.23:1 |

The ribbon’s declared solid pair `#fff6d9` / `#9b5837` computes to 5.06:1. The overall probe separately passed the rendered title screen. Grass-background labels were darkened after a conservative source-palette check; their variable SVG background is not claimed as one universal measured ratio.

## Findings, corrections, and rechecks

| Finding | Source in final tree | Correction and recheck |
| --- | --- | --- |
| Medium: small text and ribbon contrast | `src/style.css:39`, `src/style.css:71`, `src/style.css:157` | Header farm text was 3.74:1, ribbon text 3.28:1 in the probe, and selected timing 4.38:1 in the palette check. Darkened the relevant roles. Final probe passes and rendered gameplay pairs now exceed 4.5:1. |
| Medium: extra slogan clutter | `src/App.tsx:224` and welcome copy below it | Initial probe found six short slogan lines. Kept the requested tagline, simplified Pip’s bubble and the supporting text. Final probe reports one slogan line. |
| High: modal focus return and containment | `src/App.tsx:34` | Unmounting a dialog did not reliably return focus; a dedicated keyboard check later found a Tab sequence could leave the content. Added explicit opener restoration and Tab/Shift+Tab wrapping around enabled visible controls. Final keyboard plant/harvest/sale, 18-step loop, Escape, and focus-return checks pass. |
| Medium: phone seed names split across lines | `src/style.css:397` | The compact horizontal icon/name layout split Sunflower and Strawberry. Changed phone seeds to vertically composed illustrations and labels. All six are single-line in the final 390 px browser check and were visually inspected. |
| Medium: basket was only implicit in the Market badge | `src/App.tsx:296` | Added a permanent harvest-basket control showing total goods and their actual sell value. Final populated farm screenshots show the values and its Market interaction works. |
| Low: final-hit projectile could be hidden by retreat | `src/App.tsx:261`, `src/style.css:294` | Allowed the final weapon hit to render with a retreat event, remount recoil on a new attack, and fade the projectile rather than retaining a beam. All weapon engine cases and rendered interception pass. |
| Medium: save-warning dismissal could imply a successful save | `src/App.tsx:80`, `src/App.tsx:304` | Kept warning dismissal separate from save status; title ticks do not overwrite a damaged save before Play. Browser checks confirm corrupt data remains until starting and storage-disabled play keeps “Check save status” after dismissal. |

No reproduced blocking finding remains open. Source locations identify the final implementation, not generated bundle lines.

## Saved visual evidence

- [`images/title-mobile.png`](images/title-mobile.png): 390 px title, identifiable game and Play now on the first screen.
- [`images/farm-desktop.png`](images/farm-desktop.png): eight ripe plots, six illustrated crops, all defenses, basket, balance, and a successful defense message.
- [`images/farm-mobile.png`](images/farm-mobile.png): complete 390 px gameplay layout with readable seed names and live local statistics.
- [`images/keyboard-mobile.png`](images/keyboard-mobile.png): visible keyboard outline on the first interactive plot.

Additional tested shop screenshots and temporary JSON reports are reproducible with the browser scripts. The social PNG was also opened and visually inspected.

## Remaining limitations and completion

The browser connector itself returned a transport error, so rendered validation used the supplied Chromium toolchain directly. WebKit could not start because the supplied executable was absent; no Safari result is claimed. Physical mobile devices, screen-reader sessions, native zoom, forced colors, RTL/localization, and slow-motion DevTools inspection remain unperformed.

API availability and wheel motion are external. The game displays Offline or Wheel resting when appropriate and never promises Sunshine. Saves are local to one browser origin; without Web Locks, use one tab. Browser storage is not a secure or shared ledger, and editing a local save is outside the game’s trust model.

**Complete for the implemented gameplay and static-delivery scope**, with the verification limits above. A public hosting URL remains an after-review handoff. No requested gameplay feature is being represented by a placeholder or a fake live service.
