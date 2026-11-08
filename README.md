# Altops Workshop

Workshop management system for **Altops Furniture Enterprise** (Kumasi).

Six screens cover the whole shop: **Dashboard → Job Pipeline → Lumber & Hardware
→ Workshop Locker → Labor & Schedule → Quoting & Financials**. Each job opens a
drawer that walks **Details → Measure → Estimate → Plan → Drawings → 3D → Photos**.

Everything is stored in the browser (`localStorage`) — no account, no server
database. **Settings → Backup** writes the whole database to one JSON file and
restores it, so a cleared browser does not lose the shop's records.

- **Measure** — photograph the wood next to a reference object; the AI reads
  real dimensions off the photo.
- **Estimate** — cabinet-type presets → a printable invoice.
- **Plan** — outer size + shelves/doors → a cut list, sheet count, yield and a
  to-scale layout of every sheet. Grain-critical panels (doors, sides, tops)
  never get turned; sheet size and saw kerf are adjustable.
- **Drawings** — printable technical sheets.
- **3D** — native three.js preview with wood textures, shadows and hardware.

## Stack

Vite · React 18 · Tailwind v4 · three.js. The Measure feature calls a small
serverless function (`api/measure.js`) that holds the Anthropic API key — the key
never reaches the browser.

## Running it

```bash
npm install
cp .env.example .env        # then put your Anthropic key in .env
npm run dev                  # http://localhost:5173
```

`npm run dev` serves the app **and** `/api/measure` (Vite middleware), so it's
the only process you run. Without a key the app works fine — the Measure tab
just shows "not configured".

```bash
npm run build && npm run preview   # production build
```

## Deploy

Push to GitHub and let **Vercel** build it (`.vercel.json` pins the output to
`dist`). `api/measure.js` is picked up as a serverless function automatically.
Set `ANTHROPIC_API_KEY` (and optionally `MEASURE_MODEL`, default `claude-opus-5`)
in the project's environment variables.

## Layout

```
api/measure.js            photo -> dimensions (server-side, holds the key)
public/robots.txt
src/
  App.jsx                 shell: nav, view routing, drawer, modals, toasts
  index.css               @theme wood palette, light + dark tokens
  lib/
    backup.js             whole-database export / restore
    constants.js          wood types, cabinet presets, stages, defaults
    format.js             money / id / empty-job
    geometry3d.js         board geometry for the 3D preview
    image.js              downscale photos before storing/sending
    measure.js            client for /api/measure
    plan.js               cut-list + sheet-packing engine
    storage.js            localStorage read/write
    technicalDrawing.js   SVG sheet generator
    theme.js              light / dark / system
    woodTexture.js        procedural grain textures
  components/
    Dashboard, Pipeline, Inventory, Locker, Schedule, Financials
    JobEditor, Sidebar, Topbar, Settings, Lightbox
    panels/               Details, Measure, Estimate, Plan, Drawings,
                          Preview, Photos
    ui/                   Drawer, Modal, Toast, ThemeToggle, Ring,
                          widgets, WoodBadge
```

## Data model

Each job is one key (`wjob_<id>`); other collections use a prefix —
`wlumber_`, `wcons_`, `wtc_` — with settings at `wsettings` and small flags at
`wflag_`. `src/lib/backup.js` owns that prefix list, so a new collection only
needs one line there to join the backup.
