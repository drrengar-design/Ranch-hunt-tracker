# Ranch Hunt Tracker

Progressive web app for a ranch iPad: interactive satellite map, blinds and feeders, season occupancy, and a harvest log. All data stays on the device.

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically http://localhost:5173).

Production build:

```bash
npm run build
npm run preview
```

## iPad — Add to Home Screen

1. Open the app in **Safari** (not Chrome).
2. Tap the **Share** button.
3. Tap **Add to Home Screen**, then **Add**.
4. Launch it from the home screen. It runs full-screen like a native app.

After the first load, the ranch map and app shell are cached for offline use.

On the Map tab, **pinch to zoom** and **drag to pan**. Page zoom is turned off so those gestures stay on the map.

## Site access code

Before the app UI loads, a gate asks for a site code. The correct code is checked in the browser only. Success sets `sessionStorage` key `ranchHuntSiteUnlocked=1`, so this browser tab/session stays unlocked until it is closed (or you tap **Lock** in Settings). A new session must enter the code again.

Default site access code is **1808**. Change it with a Vite env var (do not commit `.env`):

```bash
# .env
VITE_SITE_PIN=your-code
```

If `VITE_SITE_PIN` is unset, the app falls back to `1808`. See `.env.example`. Rebuild after changing the env var so it is baked into the client bundle. On Netlify, set `VITE_SITE_PIN` in Site configuration → Environment variables.

This gate is separate from **Admin mode** below (blinds/feeders editing). Site access is **not** the Admin PIN.

## Admin mode

Default Admin PIN is **1234** (stored in app data; change it in Settings). This PIN only unlocks admin map tools; it does not replace the site access code.

| Code | Default | Where it lives | What it unlocks |
| --- | --- | --- | --- |
| Site access | **1808** | `VITE_SITE_PIN` (or built-in default) | The PIN gate before the app UI |
| Admin PIN | **1234** | App data / Settings | Map edit tools (blinds & feeders) |

| Admin OFF | Admin ON |
| --- | --- |
| View map, check in/out of blinds, log harvest | Drag pins, add/delete/rename blinds & feeders |

Tap **Admin OFF** in the header (or Settings → Unlock admin) and enter the PIN.

## Map

The annotated ranch satellite photo is a Leaflet `CRS.Simple` image overlay (`public/assets/ranch-map-annotated.jpg`):

- **Yellow** — property boundary and hunting lanes/roads
- **Green Laguna** — ~2-acre pond, upper-left
- **Blue well** — well/campsite west of Laguna

Suggested blinds sit on lanes, overlook Laguna from the south or east, and stay clear of the well/camp. Restore that layout anytime from Settings (admin).

## Tabs

- **Map** — pinch-zoom map, legend, pins
- **Blinds** — occupancy board
- **Seasons** — hunting seasons (occupancy and harvest attach to the active one)
- **Harvest** — log and totals
- **Settings** — site lock, admin PIN, backup, layout restore, home-screen notes

## Data

Saved to **localStorage** and **IndexedDB**. Export/import JSON from Settings. Nothing is sent to a server.

Do not deploy this copy externally unless you intend to; it is meant to run locally on the ranch iPad.
