# Ranch Hunt Tracker

Progressive web app for a ranch iPad: interactive satellite map, blinds and feeders, season occupancy, harvest log, and live cross-device sync. GitHub holds **code and Netlify deploys only** — live check-ins, pin positions, and corn fills are not stored in the repo.

Live: [https://rancho-1808-hunt.netlify.app](https://rancho-1808-hunt.netlify.app)

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically http://localhost:5173). The Netlify Vite plugin exposes `/api/sync` and a local Blobs sandbox.

Production build:

```bash
npm run build
npm run preview
```

```bash
npm test
```

## Live sync (Netlify Functions + Blobs)

One site-scoped Blobs object holds the authoritative ranch JSON (`checkIns`, `harvests`, `markers` including x/y/name/kind/notes, `seasons`, `hunterRoster`, `cornFillEvents`, corn settings). IndexedDB/localStorage remain the offline cache.

### Endpoints

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| `GET` | `/api/sync` | Header `X-Ranch-Sync-Secret` | Returns `{ data, etag }` |
| `PUT` / `POST` | `/api/sync` | Same secret + optional `If-Match` | Conditional write to Blobs |

Readers and writers both need the ranch secret so occupancy is not world-readable.

### Netlify environment variables

In **Site configuration → Environment variables** (or `netlify env:set`):

| Variable | Where | Purpose |
| --- | --- | --- |
| `RANCH_SYNC_SECRET` | Server (functions) | Required for GET/PUT. If unset, functions fall back to `1808`. |
| `VITE_RANCH_SYNC_SECRET` | Build (optional) | Bakes the same secret into the client. Rebuild after changing. |
| `VITE_SITE_PIN` | Build | Site gate only (default **5858**). **Not** the sync secret. |

Set `RANCH_SYNC_SECRET` to a dedicated value in production. Until you do, the documented default is `1808` (independent of the site access code).

On a device, Settings → **Ranch sync secret** stores an override in `localStorage` (`ranch-hunt-sync-secret`) when `VITE_RANCH_SYNC_SECRET` is not baked in.

### Blobs

No extra dashboard enable step is required for Netlify Blobs on a linked site. The function uses store `ranch-hunt`, key `state`, **strong** consistency. If a deploy logs `The environment has not been configured to use Netlify Blobs`, confirm the site is linked and retry the deploy; Blobs is zero-config on current Netlify plans.

### How devices stay in sync

1. After every check-in, check-out, harvest, pin move/add/delete, corn fill, or settings change, the client pushes the full JSON.
2. Open apps poll `GET /api/sync` every **4 seconds** (paused while the tab is hidden) and merge into local state.
3. Offline edits stay on the device. On reconnect the client pulls, merges, then pushes.

### Conflict rule

- Blob writes use **ETag / `onlyIfMatch`** (or `onlyIfNew` for the first write). A stale `If-Match` returns **409** with the current document; the client merges and retries.
- **checkIns, harvests, markers, seasons, cornFillEvents:** union by `id`. Same id → later `updatedAt` (or `filledAt` / `at`) wins. Two devices adding different check-ins or fills both survive.
- **Marker positions** are fields on the marker record, so a drag on one iPad shows up on the next poll for everyone. Same-id coordinate edits are last-write-wins.
- **Deletes** use a merged `removedMarkerIds` list.
- **Scalars** (admin PIN, active season, default corn days/margin): last-write-wins on document `updatedAt`.

## Corn / feeders

- **Mark filled with corn** (map popup or Blinds tab) appends a `cornFillEvents[]` row (`id`, `feederId`, `filledAt`, optional `by` / `notes`) and updates last-fill.
- **Fill history** is on the feeder popup, Blinds cards, and the History tab.
- Each feeder has **`fullToEmptyDays`** (default **7** for new feeders). Set it per feeder in **Feeder settings** (map popup or Blinds tab): number of days, with presets for **1 week / 3 weeks / 1 month**. It syncs with the marker.
- **Low-corn warning** (map pin ring + Blinds badge): projected empty = last `filledAt` + **that feeder’s** `fullToEmptyDays`. Warn when now ≥ projected empty, or within **`cornWarnMarginDays`** (default **1**) before. Never-filled feeders always warn.
- Settings stores synced defaults: `cornWarnDays` (new feeders / fallback) and `cornWarnMarginDays`.

## iPad — Add to Home Screen

1. Open the app in **Safari** (not Chrome).
2. Tap the **Share** button.
3. Tap **Add to Home Screen**, then **Add**.
4. Launch it from the home screen. It runs full-screen like a native app.

After the first load, the ranch map and app shell are cached for offline use. `/api/sync` is network-only (not cached by the service worker).

On the Map tab, **pinch to zoom** and **drag to pan**. Page zoom is turned off so those gestures stay on the map.

## Site access code

Before the app UI loads, a gate asks for a site code. The correct code is checked in the browser only. Success sets `sessionStorage` key `ranchHuntSiteUnlocked=1`, so this browser tab/session stays unlocked until it is closed (or you tap **Lock** in Settings). A new session must enter the code again.

Default site access code is **5858**. Change it with a Vite env var (do not commit `.env`):

```bash
# .env
VITE_SITE_PIN=your-code
```

If `VITE_SITE_PIN` is unset, the app falls back to `5858`. See `.env.example`. Rebuild after changing the env var so it is baked into the client bundle. On Netlify, set `VITE_SITE_PIN` in Site configuration → Environment variables. If that variable is already set to an older code, change it to `5858` and redeploy — a set value overrides the built-in default.

This gate is separate from **Admin mode** below and from the **ranch sync secret**.

## Admin mode

Default Admin PIN is **1234** (stored in app data; change it in Settings). This PIN only unlocks admin map tools; it does not replace the site access code or the sync secret.

| Code | Default | Where it lives | What it unlocks |
| --- | --- | --- | --- |
| Site access | **5858** | `VITE_SITE_PIN` (or built-in default) | The PIN gate before the app UI |
| Admin PIN | **1234** | App data / Settings | Map edit tools (blinds & feeders) |
| Ranch sync | **1808** until you set env | `RANCH_SYNC_SECRET` + client secret | Read/write `/api/sync` |

| Admin OFF | Admin ON |
| --- | --- |
| View map, check in/out of blinds, log harvest, mark corn fills, edit feeder duration | Drag pins, add/delete/rename blinds & feeders |

Tap **Admin OFF** in the header (or Settings → Unlock admin) and enter the PIN.

## Map

The ranch satellite photo is a Leaflet `CRS.Simple` image overlay (`public/assets/ranch-map-yellow-logo-enhanced.png`, 1476×787):

- **Yellow** — property boundary and hunting lanes/roads baked into the photo
- **Green Laguna** — ~2-acre pond, northeast ranch
- **Blue well** — well/campsite at the northeast corner, north of Laguna
- **Red dots** — baked-in blind locations on the photo

Suggested pins are Blind 1–7 and Feeder 1–7 on those lanes. Restore that layout anytime from Settings (admin). Moves sync to other devices.

## Tabs

- **Map** — pinch-zoom map, legend, pins, occupancy, low-corn badges
- **Blinds** — occupancy board, corn status, mark filled, feeder duration
- **Seasons** — ranch-managed hunting seasons (occupancy and harvest attach to the active one)
- **Regs** — read-only TPWD Duval / South Zone calendar (Ramirez area). Not the editable ranch season list.
- **Harvest** — log and totals
- **History** — check-in log and corn-fill log (filters + CSV for check-ins)
- **Settings** — site lock, sync secret, corn defaults, admin PIN, backup, layout restore

## Data

Local **cache:** localStorage + IndexedDB. **Source of truth when online:** Netlify Blobs via `/api/sync`. Export/import JSON from Settings still works; imported data is pushed to the shared store.

Do not commit live occupancy or fills to git.
