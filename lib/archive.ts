/**
 * Demo archive built by scripts/build_demo_assets.py from real Pipeline-V2 survey photos.
 * Boxes are real detector output; the CORAL/OTHERS filter and health classes are simulated (raw.mock).
 * Swap this module for API calls once the FastAPI backend exists; the rest of the app only sees the types.
 */
import raw from "./data/demo-archive.json"
import type { Detection, ReefImage, Station } from "./types"

export const DEMO_NOTE: string = raw.mockNote

export const MODEL_VERSIONS = {
  detector: "YOLOv8m · 5f0dbadf73 (frozen)",
  filter: "ResNet50 CORAL/OTHERS · not trained yet",
  classifier: "ResNet50 LC/PB/DC/DCA · not trained yet",
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

export const STATIONS: Station[] = raw.stations.map((s) => ({
  id: slug(s.name),
  name: `${s.site.replace(/-/g, " ")} · ${s.depth}`,
  site: s.site.replace(/-/g, " "),
  depth: s.depth as Station["depth"],
  depthM: s.depthM,
  lat: s.lat,
  lng: s.lng,
}))

const stationByRawName = new Map(raw.stations.map((s, i) => [s.name, STATIONS[i]]))

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
    status: img.status as ReefImage["status"],
    detections: img.detections as Detection[],
    provenance: {
      source: img.status === "pending" ? "upload" : "archive",
      uploader: img.status === "pending" ? "Field team (demo)" : "CoralNet survey 2024",
      uploadedAt: img.status === "pending" ? `${img.date}T16:00` : null,
      locationSource: "station",
      models: MODEL_VERSIONS,
      simulated: true,
    },
  }
})

export const stationById = (id: string | null | undefined) => STATIONS.find((s) => s.id === id)
