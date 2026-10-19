import { addCounts, countClasses, emptyCounts, HEALTH_CLASSES, totalOf } from "./classes"
import type { ClassCounts, HealthClass, ReefImage, Station } from "./types"

export interface StationSummary {
  station: Station
  images: number
  /** T_station = sum of per-image count vectors (proposal 4.2.2.6) */
  totals: ClassCounts
  /** totals / images: colonies per quadrat, comparable across stations with different effort */
  perQuadrat: Record<HealthClass, number>
  colonies: number
  others: number
}

export type HeatMetric = "perQuadrat" | "total"

/** Only approved images feed the map and the station statistics (SRS FR-5). */
export function summarizeStations(stations: Station[], images: ReefImage[]): StationSummary[] {
  return stations.map((station) => {
    const own = images.filter((i) => i.stationId === station.id && i.status === "approved")
    let totals = emptyCounts()
    let others = 0
    for (const img of own) {
      const c = countClasses(img.detections)
      totals = addCounts(totals, c)
      others += img.detections.length - totalOf(c)
    }
    const n = own.length
    const perQuadrat = Object.fromEntries(HEALTH_CLASSES.map((k) => [k, n ? totals[k] / n : 0])) as Record<HealthClass, number>
    return { station, images: n, totals, perQuadrat, colonies: totalOf(totals), others }
  })
}

export function overall(summaries: StationSummary[]) {
  const totals = summaries.reduce((acc, s) => addCounts(acc, s.totals), emptyCounts())
  const images = summaries.reduce((a, s) => a + s.images, 0)
  return { totals, images, colonies: totalOf(totals), stations: summaries.filter((s) => s.images > 0).length }
}

export const pct = (part: number, whole: number, digits = 0) =>
  whole ? `${((part / whole) * 100).toFixed(digits)}%` : "–"

export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })

/** What the thermal heatmap measures: one health class, or all not-live colonies (PB + DC + DCA). */
export type HeatTarget = "NOTLIVE" | HealthClass

export const HEAT_TARGETS: { id: HeatTarget; label: string; hint: string; classes: HealthClass[] }[] = [
  { id: "NOTLIVE", label: "Not live", hint: "Partially bleached + dead colonies", classes: ["PB", "DC", "DCA"] },
  { id: "LC", label: "Live coral", hint: "Living, normally pigmented colonies", classes: ["LC"] },
  { id: "PB", label: "Partially bleached", hint: "Colonies with pale or white tissue", classes: ["PB"] },
  { id: "DC", label: "Dead coral", hint: "Recently dead skeletons", classes: ["DC"] },
  { id: "DCA", label: "Dead coral with algae", hint: "Dead skeletons overgrown by algae", classes: ["DCA"] },
]

export function heatValue(s: StationSummary, target: HeatTarget, metric: HeatMetric) {
  const classes = HEAT_TARGETS.find((t) => t.id === target)!.classes
  return classes.reduce((a, k) => a + (metric === "total" ? s.totals[k] : s.perQuadrat[k]), 0)
}
