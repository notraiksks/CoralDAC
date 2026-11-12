/**
 * Example archive: 42 real Pipeline-V2 survey photos (images by scripts/build_demo_assets.py). Their boxes, CORAL/OTHERS
 * decisions, health classes and colony outlines are output of the final pipeline (Pipeline-V2 ops/tools/coraldac_demo_archive.py).
 */
import raw from "./data/demo-archive.json"
import type { Detection, ReefImage, Station } from "./types"

export const DEMO_NOTE: string = raw.mockNote

type ModelVersions = { detector: string; filter: string; classifier: string }

export const MODEL_VERSIONS: ModelVersions = (raw as { models?: ModelVersions }).models ?? {
  detector: "YOLOv8m x3 combined (E3x)",
  filter: "ResNet50 CORAL/OTHERS",
  classifier: "ResNet50 background-gray LC/PB/DC/DCA",
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

export const stationById = (id: string | null | undefined) => STATIONS.find((s) => s.id === id)
