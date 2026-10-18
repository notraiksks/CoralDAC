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
