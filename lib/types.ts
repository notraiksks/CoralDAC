/**
 * Domain model for the two-stage pipeline:
 *   Stage 1  YOLOv8 detector, one class "coral"            -> box + detConf
 *   Stage 2a ResNet50 filter, CORAL vs OTHERS              -> filter + filterConf
 *   Stage 2b ResNet50 health classifier, LC / PB / DC / DCA -> health + healthConf (CORAL only)
 */
export type HealthClass = "LC" | "PB" | "DC" | "DCA"
export type FilterClass = "CORAL" | "OTHERS"

export interface Detection {
  id: string
  /** [x, y, w, h], normalised to 0..1 of the image */
  box: [number, number, number, number]
  detConf: number
  filter: FilterClass
  filterConf: number
  health?: HealthClass
  healthConf?: number
  /** set when a reviewer changed the model's class */
  reviewed?: HealthClass | "OTHERS"
}

export type ImageStatus = "approved" | "pending" | "rejected"
export type LocationSource = "station" | "exif" | "manual"

export interface Station {
  id: string
  name: string
  site: string
  depth: "Deep" | "Shallow"
  depthM: number | null
  lat: number
  lng: number
}

export interface ReefImage {
  id: string
  file: string
  /** URL of the full image (demo asset or object URL for uploads) */
  src: string
  thumb: string
  stationId: string | null
  lat: number
  lng: number
  date: string
  transect: string
  quadrat: number | null
  width: number
  height: number
  camera: string
  status: ImageStatus
  detections: Detection[]
  provenance: Provenance
}

export interface Provenance {
  source: "archive" | "upload"
  uploader: string
  uploadedAt: string | null
  locationSource: LocationSource
  models: { detector: string; filter: string; classifier: string }
  /** true when Stage 2 output is simulated (no trained model / API yet) */
  simulated: boolean
  review?: { by: string; at: string; decision: "approved" | "rejected"; reason?: string; note?: string }
}

export type Role = "viewer" | "contributor" | "reviewer"

export type ClassCounts = Record<HealthClass, number>
