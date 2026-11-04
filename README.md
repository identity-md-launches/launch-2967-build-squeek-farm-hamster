# Squeek Farm: Hamster Wars

**Grow. Harvest. Defend. Expand.**

A playable, single-player cartoon farm for Squeekchain Genesis. Help Pip grow six crops, sell the harvest for virtual GOLD, expand a tiny patch into an eight-plot farm, and keep Brutus’s paws out of the produce. All characters, crop stages, buildings, scenery, and weapons are original SVG illustrations in `src/art.tsx`. No wallet, backend, account, or real token is required.

## Install, play, and rebuild

Use Node.js 22 and npm:

```sh
npm ci
npm run dev
```

To check and preview the production export:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`dist/` is the complete static website and is included with the source and `package-lock.json`. Vite uses `base: './'`; assets, fonts, favicon, and social image are local. Serve the directory over HTTP(S), including at an IPFS gateway subpath. No server rewrites are required. Opening `index.html` directly with `file://` is not the supported preview method.

Hosting is handled after delivery by the network. No public deployment URL has been assigned in this workspace, and no publishing operation was performed.

## How to play

1. Select **Play now**. Pick a crop in the seed shed and select an empty plot. Planting is free.
2. Crops pass through sprout, young plant, and ripe stages. Select a ripe plot to harvest it, or use **Harvest** to collect all ripe plots. Pip walks over to help.
3. Open **Market** to sell one unit, one crop’s stock, or the whole basket. Unlock new seeds there. **Expand** adds farmland; **Defense** builds automatic protection; **Economy** shows every GOLD total.

| Crop | Grow time | Units / harvest | GOLD / unit | Seed unlock |
| --- | ---: | ---: | ---: | ---: |
| Sunflower | 30 s | 8 | 2 | Free |
| Carrot | 45 s | 10 | 3 | Free |
| Strawberry | 60 s | 10 | 4 | 100 GOLD |
| Corn | 90 s | 12 | 5 | 220 GOLD |
| Pumpkin | 120 s | 12 | 7 | 450 GOLD |
| Grapes | 150 s | 12 | 9 | 750 GOLD |

Four plots are open initially. The sunny patch costs 100 GOLD and opens plots 5–6. The meadow stretch costs 250 GOLD and opens plots 7–8. A seed unlock is permanent for this save; planting remains free.

Brutus stays away for the first **90 seconds of active, visible, unpaused play**. He then visits at intervals of 90–150 active seconds when ripe crops exist. A warning precedes his approach. He targets a specific planting, picks up at most four units, and only reduces that plot’s remaining yield after a successful escape. Harvesting the target first, including during his escape, saves the crop. Your stored inventory and GOLD are always safe. There is no PvP or offline theft.

| Automatic defense | Cost | Range in farm coordinates | Cooldown | Seed damage |
| --- | ---: | ---: | ---: | ---: |
| Seed Slingshot | 60 GOLD | 190 | 1.1 s | 1 |
| Hamster Guard Tower | 160 GOLD | 285 | 1.3 s | 2 |
| Sunflower Cannon | 350 GOLD | 440 | 1.7 s | 3 |

Brutus has three resolve points. Weapons occupy three fixed slots, use distance checks, and need no aiming, ammunition, or repairs. A successful defense produces a seed attack and a retreat. Pause and Help suspend bandit activity while crops keep growing at normal speed. Sounds are optional; use the sound control or the Help dialog on mobile.

## The GOLD ledger

You start with zero GOLD. Selling harvested units mints `quantity × unit price`. All seed unlocks, land, and defense purchases spend integer GOLD, burn 80% of the cost, and move 20% into this save’s game treasury. All listed costs divide by five, so no fractional rounding is necessary.

```text
minted = player balance + treasury + burned
outstanding supply = player balance + treasury
```

Transactions check stock, affordability, existing unlocks, and limits before changing state. A second harvest or sale cannot collect the same goods again. The Economy popup explicitly describes these as local game statistics. GOLD has no cash value, withdrawal mechanism, ERC-20 contract, or guaranteed deflation.

## Authentic Squeekchain data

The public endpoint is [`GET https://api.squeekchain.com/v1/status`](https://api.squeekchain.com/v1/status), verified against the [official API reference](https://docs.squeekchain.com/developers/api/) and a successful live response on 2026-11-04. The endpoint returned HTTP 200 with `Access-Control-Allow-Origin: *`.

`src/chain.ts` supports `schemaVersion: 1`. It checks the response’s `generatedAt`, `measurement.observedAt`, `receivedAt`, `freshness`, `staleAfterSeconds`, `provenance`, `coreStatus`, `rpmMilli`, `speedMmPerSecond`, and `oracle.state`. Accepted hardware data must be fresh, `ACTIVE`, and show positive RPM and speed before **Squeek Sunshine** enables a capped 10% growth-speed bonus. A fresh idle wheel is labeled **Wheel resting**.

Polling runs every 15 seconds, with an eight-second timeout and no concurrent requests. Unknown schemas, simulated data, stale/future readings, API errors, network failures, and CORS restrictions produce **Offline**, with ordinary farming intact. An expired reading cannot continue the bonus. Browser scenarios use explicitly controlled responses to test spinning and failure states; those responses are not shipped as live data. No bonus is awarded for time away, and repeated API polls grant no progress by themselves.

## Saving and time

The browser’s `localStorage` key is `squeek-farm-v1`. It stores inventory, the balanced ledger, crop timestamps and accumulated growth, unlocks, plots, defenses, active protection time, and statistics. A timestamp checkpoint prevents refreshes from counting elapsed growth twice. Offline maturation uses base growth only; interrupted raids are abandoned without loss. Long/background frames do not count as active play.

Modern browsers use the Web Locks API for a single save writer. A second tab displays the synchronized farm with gameplay disabled; close the first tab and choose **Continue here**. Browsers without Web Locks should use one game tab. Saves remain local to this browser and origin. Clearing site storage or changing IPFS origins does not migrate a farm. Storage failures and damaged saves display an explicit warning rather than claiming a successful restore.

## Validation and limitations

- Production build and TypeScript checks pass.
- 27 deterministic Vitest cases pass, covering all crops, prices, purchase rules, both expansions, all three weapons, successful theft, interception, offline restoration, Sunshine validation, and 3,000 mixed actions that maintain accounting.
- The production browser playthrough passed farming, shops, persistence, accounting, API failures, Sunshine, bandit escape/interception, and mobile layouts at 320, 390, 768, and 1440 CSS pixels, with no uncaught JavaScript errors or failed local assets.
- The pinned taste@1 probe passed 16/16 checks on the title screen. The first 390 px screen shows the game and Play now. Gameplay is also visible immediately after starting.

Detailed final results, fixes, six-domain design coverage, and remaining verification limits are recorded in [`docs/validation.md`](docs/validation.md). The implemented visual system is in [`DESIGN.md`](DESIGN.md). A short submission description is in [`docs/genesis-submission.md`](docs/genesis-submission.md). Identical delivery copies of the validation and submission text are provided under `artifacts/`.

The browser connector was unavailable, so validation used the provided Chromium Playwright toolchain with a bounded local server at a gateway-like subpath. WebKit could not launch because its browser executable was not installed. Physical iOS/Android, a screen reader, and native browser zoom were not tested. Live API availability is external; neither a spinning wheel nor a bonus is guaranteed. There are no known incomplete requested gameplay systems.

To rerun the browser scenarios with Playwright available to Node:

```sh
node scripts/browser-check.mjs
node scripts/accessibility-check.mjs
```

An externally supplied Playwright module can be selected with `--playwright=/absolute/path/to/playwright/index.mjs`. The script owns and closes its server and browser, uses simulated time rather than real waits, and writes disposable screenshots and results to `test/scratch/browser/`. `scripts/render-share.mjs` renders the original `public/share.svg` to the included social PNG; it accepts the same module option and is not required for a normal rebuild.

## Source map and artwork

- `src/game.ts`: pure gameplay transactions, growth, raids, accounting, and save validation.
- `src/chain.ts`: verified public-data parsing, freshness checks, and fetch fallback.
- `src/App.tsx`: saved game controller, native dialogs, interactions, onboarding, sound, and visual effects.
- `src/art.tsx`: original SVG world, hamsters, six crops in three stages, plots, icons, and defense illustrations.
- `src/style.css`: responsive layout, tokens, component states, and reduced-motion handling.
- `test/game.test.ts`: deterministic gameplay and data-validation tests.
- `public/`: original favicon and share artwork plus font license notices.

Nunito and Lilita One are bundled locally through Fontsource under the SIL Open Font License; notices are included in `public/licenses/` and the export. Design review used the pinned Better Interface guidance by Jakub Krehel and documentation guidance adapted from Paul Bakaus’s Impeccable; preserved licenses are in `docs/design-guidance-LICENSE`.

The `.gitignore` change has a **1 KiB path budget** and only excludes dependency directories, tool caches, pinned task inputs, TypeScript build metadata, and disposable checks. `dist/` is intentionally included. No dependency archives, vendored npm registry, submodules, credentials, wallet code, or `node_modules` are part of the delivered site.
