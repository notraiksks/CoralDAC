# Coral Reef Bleaching Classifier (CoralDAC)

A Next.js web app for uploading coral quadrat photos, classifying bleaching with YOLOv8 + ResNet50, and exploring the results on an interactive map of the Philippines.

## Features

- **Upload**: individual or batch (zip) photos with EXIF reading, an image quality check and validation (10 MB max per image). A "Try a sample photo" option is built in.
- **Interactive map**: full-viewport map with a coral-condition density heatmap, photo clusters that split as you zoom, and a side panel with the classifier details for each photo.
- **Image details**: viewer with detection boxes, station / transect / quadrat info, review editing, keyboard shortcuts, and CSV export of patches.
- **My Uploads**: uploads and review edits persist across page refreshes (IndexedDB / localStorage, this browser only).
- **Basemaps**: Esri satellite, Sentinel-2, NASA Blue Marble, street map, and a bundled offline Philippines outline. If a source fails to load, the app falls back to the next one automatically.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration (optional)

Create a `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000   # classifier API
NEXT_PUBLIC_MAPTILER_KEY=your-key           # use MapTiler instead of Esri for satellite
```

The classifier API is expected to expose `POST /classify` (multipart field `file`) and return:

```json
{ "patches": [{ "class": "...", "confidence": 0.93, "box": [x, y, w, h] }] }
```

Without `NEXT_PUBLIC_API_URL`, coral patches are **simulated** (demo mode) and the app says so on the Specifics screen.

## Project structure

| Path | What it holds |
| --- | --- |
| `app/page.tsx` | App shell and in-memory state |
| `app/components/` | Screens: map, upload, image details, my uploads |
| `app/lib/` | Ingest (EXIF, quality, zip), classify, storage, CSV export, geo helpers |
| `app/data/` | Demo reef stations and the bundled Philippines basemap. Replace the stations with your real survey sites. |
| `legacy/app-v1/` | The original CoralDAC dark UI, kept for reference and excluded from the build |

See [`CHANGES.md`](CHANGES.md) for the detailed change notes.

## Scripts

- `npm run dev`: development server
- `npm run build`: production build
- `npm run start`: serve the production build
- `npm run lint`: ESLint

## Tech

Next.js 16, React 19, Tailwind CSS 4, Leaflet / react-leaflet, supercluster, exifr, JSZip.
