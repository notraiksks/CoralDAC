/**
 * The six monitoring stations of the 2024 CoralNet survey and the model versions of the final pipeline: small, so every page can
 * import them without the example-photo archive (lib/archive.ts, about 230 KB), which only the local mode needs (V2-0396, speed).
 * Same values and ids as before (built from lib/data/demo-index.json, ids = slug of the survey station name, as in the database).
 */
import type { Station } from "./types"

export type ModelVersions = { detector: string; filter: string; classifier: string }

export const MODEL_VERSIONS: ModelVersions = {
  detector: "YOLOv8m x3 combined (E3x), threshold 0.514",
  filter: "ResNet50 CORAL/OTHERS x3 seeds, D8, threshold 0.663",
  classifier: "ResNet50 background-gray LC/PB/DC/DCA x3 seeds, D8, SAM 2.1 outline (config 42f4825b65)",
}

export const STATIONS: Station[] = [
  { id: "coral-garden-d", name: "Coral Garden · Deep", site: "Coral Garden", depth: "Deep", depthM: 7.5, lat: 13.51937, lng: 120.95555 },
  { id: "coral-garden-s", name: "Coral Garden · Shallow", site: "Coral Garden", depth: "Shallow", depthM: 4, lat: 13.51937, lng: 120.95555 },
  { id: "giant-clam", name: "Giant Clam · Shallow", site: "Giant Clam", depth: "Shallow", depthM: 3.5, lat: 13.51382, lng: 120.95979 },
  { id: "harka-piloto-d", name: "Harka Piloto · Deep", site: "Harka Piloto", depth: "Deep", depthM: 8, lat: 13.43851, lng: 121.21941 },
  { id: "harka-piloto-s", name: "Harka Piloto · Shallow", site: "Harka Piloto", depth: "Shallow", depthM: 3.5, lat: 13.43857, lng: 121.21936 },
  { id: "sapangan", name: "Sapangan · Deep", site: "Sapangan", depth: "Deep", depthM: 8, lat: 13.53176, lng: 120.95441 },
]

export const stationById = (id: string | null | undefined) => STATIONS.find((s) => s.id === id)
