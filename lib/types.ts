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
  /** [x, y, w, h], normalized to 0..1 of the image */
  box: [number, number, number, number]
  detConf: number
  filter: FilterClass
  filterConf: number
  health?: HealthClass
  healthConf?: number
  /** filter probability of OTHERS (D8 x 3-seed mean), from the model server */
  pOthers?: number
  /** health-class probabilities (D8 x 3-seed mean), from the model server */
  p?: Record<HealthClass, number>
  /** true when the SAM outline was too small and the whole crop was used */
  maskFallback?: boolean
  /** colony outline from SAM, polygon in 0..1 image coordinates (optional server field) */
  mask?: [number, number][]
  /** set when the uploader corrected the model's class */
  corrected?: HealthClass | "OTHERS"
  /** row id in the shared database (uploads only) */
  dbId?: string
}

/** analysis state of an upload in the shared database */
export type PhotoStatus = "uploading" | "queued" | "running" | "done" | "failed"

/** "none": uploaded without a location; the photo joins the map once a station is assigned */
export type LocationSource = "station" | "exif" | "manual" | "none"

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
  /** null when the photo was uploaded without a location */
  lat: number | null
  lng: number | null
  date: string
  transect: string
  quadrat: number | null
  width: number
  height: number
  camera: string
  detections: Detection[]
  provenance: Provenance
  /**
   * Class tally from the database summary (shared mode lists photos without their colonies; the colonies load on the photo's
   * page). Use imageCounts(img), which prefers the colonies when they are loaded.
   */
  counts?: ClassCounts
  /** colonies rejected as not coral, from the same summary */
  others?: number
  /** shared database only: analysis state, error text and the uploader's user id */
  status?: PhotoStatus
  error?: string | null
  owner?: string | null
}

export interface Provenance {
  source: "archive" | "upload"
  uploader: string
  uploadedAt: string | null
  locationSource: LocationSource
  models: { detector: string; filter: string; classifier: string }
  /** true when Stage 2 output is simulated (no trained model / API yet) */
  simulated: boolean
}

export type ClassCounts = Record<HealthClass, number>
