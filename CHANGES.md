# CoralDAC (web app for the coral detection + health thesis)

## v8.1: thermal heatmap (2026-10-19)
- The heatmap shows ONE quantity on a thermal (Inferno) scale: not-live colonies (PB + DC + DCA, default), or one class;
  weight per quadrat (default) or station total. Legend shows 0 .. the hottest station.
- Gentle "shimmer": a slow noise warp (a few px) and +/-12 % brightness flicker, ~24 fps, for a live weather-map feel.
  Values never change; it stops with Motion off or the OS "reduce motion" setting (`components/map/thermal-layer.tsx`).
- Basemaps: Esri Light/Dark Gray Canvas (the Ocean basemap has no data around Mindoro). Shared links (?station=) open on
  the station. Old single-page screens deleted from app/ (copy in legacy/app-v2).

## v8: UI rebuild on shadcn/ui (2026-10-19)
Why: the single-page tab app had no URLs, three colour systems, duplicated screens, fake stations/photos and a silent
simulation fallback. Rebuilt the frontend; the pipeline is not connected yet.

- Real routes (App Router): `/` map, `/stations`, `/stations/[id]`, `/images/[id]`, `/upload`, `/uploads`, `/review`, `/about`.
- shadcn/ui (base-nova, Base UI) + one token set in `app/globals.css`, light/dark (next-themes), Inter via next/font.
  Health-class colours are Okabe-Ito (colour-blind safe): LC #009e73, PB #e69f00, DC #d55e00, DCA #7b4fa0, not-coral grey.
- Domain model matches the V2 pipeline: detector box -> CORAL/OTHERS filter -> LC/PB/DC/DCA (`lib/types.ts`).
  Only CORAL detections are counted; only approved photos feed the map and station totals.
- Map: one heat layer per class (fixed colours, toggles); heat weight = colonies per quadrat (default) or station total.
  Markers that would overlap are moved apart on screen with a dashed line to the GPS point (legibility only).
- Demo data: 42 real 2024 CoralNet photos (6 stations, 36 approved + 6 waiting), real boxes from the frozen detector,
  SIMULATED filter/health classes. Built by `scripts/build_demo_assets.py` (excludes the CoralNet test cohort and all
  Detector-Boxing images). The header "Demo data" popover says what is real.
- Roles are a demo switch (Viewer / Contributor / Reviewer) in the sidebar footer; uploads persist in IndexedDB,
  review decisions in localStorage ("Reset demo data" clears both).
- Inference contract (`lib/classify.ts`): `POST {NEXT_PUBLIC_API_URL}/classify` (multipart `file`) ->
  `{ detections: [{ box:[x,y,w,h] px, det_conf, filter:"CORAL"|"OTHERS", filter_conf, health?, health_conf? }], models? }`.
  Without the API, results are simulated and labelled as such (toast + alert), never silently.
- Old single-page screens copied to `legacy/app-v2/`; the originals in `app/components`, `app/lib`, `app/data` are
  no longer used (kept until removal is approved).

## Run
    npm install
    npm run dev
    # rebuild demo assets (thesis venv): & $env:THESIS_PY scripts/build_demo_assets.py

## Where things are
- app/                 routes (thin server pages)
- components/          app shell, map/, image/, upload/, review/, stations/, ui/ (shadcn)
- lib/                 types, classes (counting), stats (station aggregation), archive (demo data), store (client state),
                       classify (API client), ingest (EXIF/ZIP/quality), geo, csv
- public/demo/         downscaled demo photos (webp)

---
# Earlier versions (history)

# Coral Reef Bleaching Classifier (UI built to the proposal, restyled)

Follows the proposal screens: brand bar + blue tab bar, Upload (Individual/Batch) -> Processing -> Specifics,
Interactive Map (heatmap, 4 layer toggles, image grid + pagination) and Image Details.

## Run
    npm install
    npm run dev

## Optional environment variables (.env.local)
    NEXT_PUBLIC_API_URL=http://localhost:8000     # FastAPI: POST /classify (multipart "file") -> { patches: [{ class, confidence, box:[x,y,w,h] }] }
    NEXT_PUBLIC_MAPTILER_KEY=...                  # optional: use MapTiler satellite instead of Esri imagery

Without NEXT_PUBLIC_API_URL, coral patches are SIMULATED (the UI says so on the Specifics screen).

## Where things are
- app/page.tsx                      app shell, in-memory state (uploads are kept for the session only)
- app/components/MapScreen.tsx      map screen;  ReefMapView.tsx = Leaflet + density heatmap
- app/components/UploadScreen.tsx   upload flow (EXIF, quality check, zip, validation)
- app/components/ImageDetailsScreen.tsx
- app/lib/ingest.ts                 MAX_IMAGE_MB (proposal says 1 MB; set to 10), EXIF, quality, zip
- app/data/reefStations.ts          demo stations — replace with your real survey sites
- legacy/app-v1/                    the previous dark UI/pages, kept for reference (excluded from the build)

## UX pass (latest)
- Compact one-row header; stats strip, station quick-jump chips, heat legend and a dismissible quick tour on the map
- Upload: step indicator + "Try a sample photo"
- Image details: keyboard shortcuts (← → + − 0 B Esc) and "Patches CSV"; map gallery "Export CSV"
- Uploads and review edits now survive a page refresh (IndexedDB / localStorage, this browser only); "Clear all" in My Uploads

## Map: iPhone-Photos style (latest)
- Navigation is a hamburger-toggled drawer (☰ top-left); the map is full-viewport with floating controls
- Photos cluster by zoom (stacked round thumbnails + count + station name); tap a cluster to zoom in and it splits; single photos show as round thumbnails ringed by coral condition
- Tapping a cluster / station opens the side panel scoped to those photos; tapping a photo shows its full classifier details inside the panel (viewer with detection boxes, station/transect/quadrat, location, review, patches); "Open full view" gives the full page
- Clustering: supercluster (client-side)

## Basemap (latest)
- A Philippines map (Natural Earth land, ~50 KB) is bundled in app/data/seaLand.json and drawn under the online tiles, so a map is always visible
- Basemap button cycles Satellite -> Street map -> Philippines outline (offline, with island/sea labels)
- If satellite/street tiles can't load (offline, firewall) the map switches itself down the chain and says so

## Map styles
- Layers button on the map opens a style picker: Satellite (Esri) · Satellite (Sentinel-2, EOX) · Satellite (NASA Blue Marble) · Street map · Built-in outline
- If a source can't load, the app tries the next one automatically (Esri -> Sentinel-2 -> NASA -> street -> built-in outline)
- Optional: NEXT_PUBLIC_MAPTILER_KEY in .env.local makes the first satellite option use MapTiler instead of Esri
