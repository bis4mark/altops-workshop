# Altops Workshop

Job tracker + public portfolio for **Altops Furniture Enterprise** (Kumasi).
One app for the whole job: **Details → Measure → Estimate → Plan → Photos**,
plus a portfolio page built from finished jobs. Everything is stored in the
browser (`localStorage`) — no account, no server database.

- **Measure** — photograph the wood next to a reference object; the AI reads
  real dimensions off the photo.
- **Estimate** — cabinet-type presets → a printable invoice.
- **Plan** — outer size + shelves/doors → a cut list and sheet count.

## Stack

Vite · React 18 · Tailwind v4. The Measure feature calls a small serverless
function (`api/measure.js`) that holds the Anthropic API key — the key never
reaches the browser.

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

Push to **Vercel** or **Netlify** — `api/measure.js` is picked up as a
serverless function automatically. Set `ANTHROPIC_API_KEY` (and optionally
`MEASURE_MODEL`, default `claude-opus-5`) in the project's environment variables.

## Layout

```
api/measure.js          photo -> dimensions (server-side, holds the key)
src/
  App.jsx               shell: nav, view routing, modals
  lib/
    constants.js        wood types, cabinet presets, statuses, defaults
    format.js           money / id / empty-job
    storage.js          localStorage read/write
    image.js            downscale photos before storing/sending
    plan.js             cut-list + sheet-packing engine
    measure.js          client for /api/measure
  components/
    Nav, Workshop, JobCard, EmptyState, JobEditor, Portfolio,
    Settings, Lightbox, primitives
    panels/             Details, Measure, Estimate, Plan, Photos
  index.css             @theme wood palette
```
