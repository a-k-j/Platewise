# Platewise — Calorie Tracker & Meal Planner

Platewise is a private, offline-first calorie tracker and daily meal planner. It is a mobile-first PWA built with React, TypeScript, Dexie/IndexedDB, Tailwind CSS, and Recharts. There is no backend, account, cloud sync, or external nutrition API: every food, meal, weight entry, and setting lives in the browser.

Plan meals as options, promote them to planned, mark what you actually ate, and see how the day and week fit your calorie target. Install it on Android or desktop and it keeps working with no connection.

## Features

### Today

- Date navigation with a date picker, previous/next day, and a jump back to today.
- Daily calorie summary: target, eaten, planned, projected, remaining, and over-target amounts.
- Separate **snack / treat budget** card showing what still fits after eaten and planned food.
- Five meal sections: breakfast, lunch, evening snacks, dinner, and other snacks / treats.
- Four entry states:
  - **Option** — considering it, not counted.
  - **Planned** — will eat, counted toward projected calories.
  - **Eaten** — consumed, counted toward eaten calories.
  - **Skipped** — decided against, not counted.
- Quick status changes, edit quantity/meal/notes, duplicate as an option, and remove with confirmation.
- Add food from the library with search, category filter, favourites, recent foods, and quantity scaling.
- Copy an entire day or a single meal to another date. Copied items become **planned** to avoid double-counting.
- Repeat a recently eaten meal on the selected date.
- Save a meal as a reusable combination and apply it later.

### Food Library

- Search by name, category, or notes.
- Category filters, favourites filter, and recently used foods.
- Add, edit, duplicate, favourite, and delete foods.
- Nutrition per serving or per 100 g, with optional protein, carbohydrate, and fat values.
- 33 seeded approximate Indian vegetarian foods to start from.
- Meal entries store a **nutrition snapshot**, so editing or deleting a food never changes historical calories.

### Weekly

- Configurable week start (Monday, Sunday, or any weekday) and week-by-week navigation.
- Stacked bar chart of eaten and planned calories with a target line.
- Click a bar to open that day on the Today page.
- Daily average, tracked days, days within target, week total, highest/lowest day, and a short written summary.
- Untracked days are excluded from averages and target comparisons instead of being treated as zero-calorie days.
- Weight tracking with kg/lb display, trend chart, weekly change, history, edit, and delete.
- Weight change compares the latest weigh-in in the week with the latest weigh-in before the week, falling back to the first/last weigh-in inside the week.

### Settings and data

- Daily calorie target and optional protein target.
- Weight unit (kg/lb), week start day, and light/dark/system theme.
- Full JSON backup export and validated JSON restore.
- One-week CSV export with per-day eaten, planned, projected, target, tracked flag, and weight.
- Clear-all confirmation that removes user data and restores starter foods and default settings.
- Install prompt where the browser supports it, plus platform-specific install instructions.
- Offline indicator and an installable app shell.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 18.3, TypeScript 5.8 |
| Build | Vite 6 |
| Storage | Dexie 4 / IndexedDB |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| Charts | Recharts 2.15 (lazy-loaded with the Weekly route) |
| Routing | React Router 6 with `HashRouter` |
| PWA | vite-plugin-pwa 1.3 / Workbox |
| Tests | Vitest 3 with `fake-indexeddb` |

## Getting started

Requires Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`). The dev server does not enable the service worker; use the production preview to test installation and offline behavior.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and build the production PWA into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run tests in watch mode. |
| `node scripts/generate-icons.mjs` | Regenerate the PNG icons and favicon in `public/`. |

### Verification

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

The test suite covers calorie summaries, week statistics, weight logic, date handling, Dexie schema/migrations, meal copying and duplication, and backup validation/import/export.

## Project structure

```text
platewise/
├─ public/                     # PWA icons, favicon, robots.txt
├─ scripts/
│  └─ generate-icons.mjs       # Reproducible icon generation (no image dependency)
├─ src/
│  ├─ components/
│  │  ├─ dashboard/            # Today cards, meal sections, add/edit/copy sheets
│  │  ├─ food/                 # Food cards and editor
│  │  ├─ layout/               # App shell, sidebar, mobile nav, logo
│  │  ├─ meals/                # Meal icons/styles
│  │  ├─ ui/                   # Buttons, sheets, dialogs, fields, toasts, status UI
│  │  └─ weekly/               # Chart, stats, weight section/editor
│  ├─ db/
│  │  ├─ database.ts           # Dexie schema versions 1 and 2
│  │  ├─ initialize.ts         # First-run seeding and repair
│  │  └─ seed.ts               # Default settings and 33 starter foods
│  ├─ hooks/                   # Live-query and browser API hooks
│  ├─ lib/                     # Dates, calculations, validation, CSV, downloads, format
│  ├─ pages/                   # Today, Weekly, Library, Settings
│  ├─ services/                # Food, meal, weight, settings, backup operations
│  ├─ test/                    # Vitest setup
│  ├─ types/                   # Domain types and shared constants
│  ├─ App.tsx                  # Hash routes and lazy Weekly page
│  ├─ index.css                # Tailwind layers and design tokens
│  └─ main.tsx                 # Database init, render, service-worker registration
├─ index.html                  # Splash screen and pre-paint theme script
├─ tailwind.config.js
├─ vite.config.ts              # PWA manifest, Workbox, Vitest config
└─ package.json
```

## How the calorie model works

| Status | Counts toward eaten | Counts toward projected | Notes |
| --- | --- | --- | --- |
| Option | No | No | Still being considered. |
| Planned | No | Yes | Expected to be eaten. |
| Eaten | Yes | Yes | Actually consumed. |
| Skipped | No | No | Kept for history, not counted. |

- **Consumed / eaten** = sum of entries marked Eaten.
- **Planned** = sum of entries marked Planned.
- **Projected** = Eaten + Planned.
- The snack/treat budget is based on what remains after projected calories, so it shows what can still be added without exceeding the target.

Food nutrition is multiplied by entry quantity. All nutrition is stored as a snapshot on the meal entry, so later food edits do not rewrite history.

## Data and privacy

- Everything is stored in IndexedDB database `platewise-db` in the current browser and origin.
- No network requests are made for app data. The app works offline after the first successful load.
- Backup JSON is generated locally and downloaded by the browser; it is never uploaded.
- Restoring a backup replaces all current foods, meals, weights, saved combinations, and settings.
- Clearing site data or using **Clear all data** removes local records. Export a backup first if the data matters.
- Data is not encrypted at rest beyond the browser's own storage protections.

### Schema migrations

Dexie schema version 1 contains foods, meal entries, weights, and settings. Version 2 non-destructively adds saved meal combinations, app metadata, and a `[date+mealType]` index. Existing records are preserved when upgrading.

## Build and deployment

```bash
npm run build
npm run preview   # verify the production build locally
```

Deploy the generated `dist/` folder to any static host: Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3/CloudFront, nginx, or a local static server.

The app is intentionally portable:

- `base: './'` allows deployment at a domain root or a sub-path.
- `HashRouter` means routes work without server-side rewrite rules.
- The manifest uses `start_url: './'` and `scope: './'`.
- The service worker uses `navigateFallback: 'index.html'` and precaches the app shell and lazy Weekly chunk.

PWA installation requires HTTPS, except on `localhost`/`127.0.0.1`. After deploying, open the site once, then use the browser's install action. On Android/Chrome use **Install app** or **Add to Home screen**; on desktop Chrome/Edge use the install icon in the address bar; on iPhone/Safari use **Share → Add to Home Screen**.

### Offline verification

1. Run `npm run build && npm run preview`.
2. Open the preview URL and wait for the app to load.
3. Confirm the service worker is active in DevTools → Application → Service Workers.
4. Stop the preview server or switch DevTools to Offline.
5. Reload. Today, Weekly, the food library, and settings should still load from the precache.

## Known limitations

- Data is local to one browser profile and origin. There is no account, cloud sync, or multi-device merge; moving data requires exporting and importing a backup.
- Import is a full replace, not a merge.
- The seeded foods use approximate reference nutrition. They are a starting point, not dietary or medical advice.
- Nutrition values are snapshots. Editing a food later does not update existing meal entries.
- There is no barcode scanner, external food database, exercise/calorie-burn tracking, or macro goal beyond the optional protein target.
- The weekly CSV export covers one selected week at a time.
- Dates use the device's local calendar. Changing timezone near midnight can change which day is treated as "today."
- PWA install prompts are browser-dependent. iOS Safari does not expose the same prompt and requires the manual Share flow.
- Recharts makes the lazy Weekly chunk larger than the rest of the app. It is loaded only when the Weekly page is opened and is precached for offline use.
- IndexedDB is subject to browser storage quotas and can be cleared by the browser or user. Keep periodic JSON backups.
- Service-worker updates are applied automatically (`skipWaiting`/`clientsClaim`), so a new version may activate on the next load rather than waiting for an explicit update prompt.

## License

This project is provided for personal use. Add a license file if you intend to distribute it.
