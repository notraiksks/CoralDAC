/**
 * Example archive: 42 real Pipeline-V2 survey photos (images by scripts/build_demo_assets.py). Their boxes, CORAL/OTHERS
 * decisions, health classes and colony outlines are output of the final pipeline (Pipeline-V2 ops/tools/coraldac_demo_archive.py).
 */
import raw from "./data/demo-index.json" // outlines are in public/demo/masks/<id>.json (scripts/split_archive.mjs)
import type { Detection, ReefImage } from "./types"

import { MODEL_VERSIONS, STATIONS, stationById } from "./stations"

// stations and model versions live in lib/stations.ts (small, for every page); re-exported here for older imports
export { MODEL_VERSIONS, STATIONS, stationById }

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
const stationByRawName = new Map(raw.stations.map((s) => [s.name, stationById(slug(s.name))!]))

export const ARCHIVE_IMAGES: ReefImage[] = raw.images.map((img) => {
  const st = stationByRawName.get(img.station)!
  return {
    id: img.id,
    file: img.file,
    src: `/demo/full/${img.id}.webp`,
    thumb: `/demo/thumb/${img.id}.webp`,
    stationId: st.id,
    lat: st.lat,
    lng: st.lng,
    date: img.date,
    transect: img.transect,
    quadrat: img.quadrat,
    width: img.width,
    height: img.height,
    camera: img.camera,
    detections: img.detections as Detection[],
    provenance: {
      source: "archive",
      uploader: "CoralNet survey 2024",
      uploadedAt: null,
      locationSource: "station",
      models: MODEL_VERSIONS,
      simulated: raw.mock,
    },
  }
})

