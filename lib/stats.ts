import { addCounts, emptyCounts, HEALTH_CLASSES, imageCounts, imageOthers, impactedShare, totalOf } from "./classes"
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

/**
 * Which photos count on the map and in the station statistics: every analyzed photo with a station, at once (no curator,
 * Rai, 2026-11-10 / 2026-11-12). Photos without a station wait for one; a photo deleted by its uploader is gone.
 */
export const countsOnMap = (i: ReefImage) => i.stationId !== null

export function summarizeStations(stations: Station[], images: ReefImage[]): StationSummary[] {
  return stations.map((station) => {
    const own = images.filter((i) => i.stationId === station.id && countsOnMap(i))
    let totals = emptyCounts()
    let others = 0
    for (const img of own) {
      const c = imageCounts(img)
      totals = addCounts(totals, c)
      others += imageOthers(img)
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

/**
 * What the thermal heatmap measures: the share of affected colonies, PB + DC + DCA (a rate, 0..100%), or a count of
 * colonies (all affected, or one class) weighted per quadrat or as a station total.
 */
export type HeatTarget = "SHARE" | "NOTLIVE" | HealthClass

export const HEAT_TARGETS: { id: HeatTarget; label: string; hint: string; classes: HealthClass[] }[] = [
  { id: "SHARE", label: "Affected coral (%)", hint: "Share of colonies: PB, DC or DCA", classes: [] },
  { id: "NOTLIVE", label: "Affected coral (count)", hint: "Colonies: PB, DC or DCA", classes: ["PB", "DC", "DCA"] },
  { id: "LC", label: "Live coral", hint: "Healthy, normal color", classes: ["LC"] },
  { id: "PB", label: "Partially bleached", hint: "Pale or white tissue", classes: ["PB"] },
  { id: "DC", label: "Dead coral", hint: "Recently dead skeleton", classes: ["DC"] },
  { id: "DCA", label: "Dead coral with algae", hint: "Dead, covered by algae", classes: ["DCA"] },
]

/** SHARE is a fraction 0..1 (metric does not apply); the others are colony counts. */
export function heatValue(s: StationSummary, target: HeatTarget, metric: HeatMetric) {
  if (target === "SHARE") return impactedShare(s.totals)
  const classes = HEAT_TARGETS.find((t) => t.id === target)!.classes
  return classes.reduce((a, k) => a + (metric === "total" ? s.totals[k] : s.perQuadrat[k]), 0)
}

/** Legend maximum: rates use the fixed 0..100% scale, counts scale to the highest station shown. */
export function heatMax(summaries: StationSummary[], target: HeatTarget, metric: HeatMetric) {
  if (target === "SHARE") return 1
  return Math.max(1e-9, ...summaries.map((s) => heatValue(s, target, metric)))
}

export function formatHeat(v: number, target: HeatTarget, metric: HeatMetric) {
  if (target === "SHARE") return `${Math.round(v * 100)}%`
  return metric === "total" ? String(Math.round(v)) : fmt1(v)
}
