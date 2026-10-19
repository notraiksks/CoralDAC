import { MODEL_VERSIONS } from "./archive"
import type { Detection, HealthClass } from "./types"

/**
 * Inference entry point.
 *
 * With NEXT_PUBLIC_API_URL set, the image is POSTed (multipart field "file") to `${API}/classify`, which should answer
 *   { detections: [{ box: [x, y, w, h] (pixels), det_conf, filter: "CORAL"|"OTHERS", filter_conf,
 *                    health?: "LC"|"PB"|"DC"|"DCA", health_conf? }],
 *     models?: { detector, filter, classifier } }
 * Without it, or when the call fails, a seeded simulation is returned and flagged, and the UI says so.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface InferenceResult {
  detections: Detection[]
  models: typeof MODEL_VERSIONS
  simulated: boolean
  /** why the result is simulated */
  reason?: "no-api" | "api-error"
}

export const apiConfigured = Boolean(API_URL)

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function runInference(file: File, dims: { width: number; height: number }): Promise<InferenceResult> {
  if (API_URL) {
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/classify`, { method: "POST", body })
      if (!res.ok) throw new Error(String(res.status))
      const json = await res.json()
      const detections: Detection[] = (json.detections ?? []).map((d: any, i: number) => {
        const [x, y, w, h] = d.box as number[]
        return {
          id: `D${String(i + 1).padStart(2, "0")}`,
          box: [x / dims.width, y / dims.height, w / dims.width, h / dims.height],
          detConf: Number(d.det_conf),
          filter: d.filter === "OTHERS" ? "OTHERS" : "CORAL",
          filterConf: Number(d.filter_conf),
          health: d.health,
          healthConf: d.health_conf != null ? Number(d.health_conf) : undefined,
        } satisfies Detection
      })
      return { detections, models: json.models ?? MODEL_VERSIONS, simulated: false }
    } catch {
      return { detections: simulate(file), models: MODEL_VERSIONS, simulated: true, reason: "api-error" }
    }
  }
  return { detections: simulate(file), models: MODEL_VERSIONS, simulated: true, reason: "no-api" }
}

function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function simulate(file: File): Detection[] {
  const rnd = mulberry32(hashString(`${file.name}:${file.size}`))
  const classes: HealthClass[] = ["LC", "LC", "LC", "PB", "PB", "DC", "DCA"]
  const n = 8 + Math.floor(rnd() * 12)
  return Array.from({ length: n }, (_, i) => {
    const w = 0.06 + rnd() * 0.14
    const h = 0.06 + rnd() * 0.14
    const other = rnd() < 0.1
    return {
      id: `D${String(i + 1).padStart(2, "0")}`,
      box: [0.05 + rnd() * (0.9 - w), 0.05 + rnd() * (0.9 - h), w, h],
      detConf: Math.round((0.45 + rnd() * 0.5) * 100) / 100,
      filter: other ? "OTHERS" : "CORAL",
      filterConf: Math.round((0.6 + rnd() * 0.39) * 100) / 100,
      health: other ? undefined : classes[Math.floor(rnd() * classes.length)],
      healthConf: other ? undefined : Math.round((0.55 + rnd() * 0.43) * 100) / 100,
    } satisfies Detection
  })
}
