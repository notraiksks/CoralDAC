import type { ClassCounts, Detection, HealthClass, ReefImage } from "./types"

export const HEALTH_CLASSES: HealthClass[] = ["LC", "PB", "DC", "DCA"]

export const CLASS_META: Record<HealthClass | "OTHERS", { label: string; hint: string; color: string }> = {
  LC: { label: "Live coral", hint: "Living, normally pigmented colony", color: "var(--lc)" },
  PB: { label: "Partially bleached", hint: "Colony with pale or white tissue", color: "var(--pb)" },
  DC: { label: "Dead coral", hint: "Recently dead skeleton, no tissue", color: "var(--dc)" },
  DCA: { label: "Dead coral with algae", hint: "Dead skeleton overgrown by algae", color: "var(--dca)" },
  OTHERS: { label: "Not coral", hint: "Rejected by the CORAL vs OTHERS filter", color: "var(--others)" },
}

export const emptyCounts = (): ClassCounts => ({ LC: 0, PB: 0, DC: 0, DCA: 0 })

/** The class a detection finally counts as (the uploader's correction first). */
export function finalClass(d: Detection): HealthClass | "OTHERS" {
  if (d.corrected) return d.corrected
  if (d.filter === "OTHERS" || !d.health) return "OTHERS"
  return d.health
}

/** Per-image integer tally (proposal 4.2.2.5): only CORAL detections are counted. */
export function countClasses(dets: Detection[]): ClassCounts {
  const c = emptyCounts()
  for (const d of dets) {
    const k = finalClass(d)
    if (k !== "OTHERS") c[k]++
  }
  return c
}

/** A photo's tally: from its colonies when loaded, else from the database summary. */
export function imageCounts(img: Pick<ReefImage, "detections" | "counts">): ClassCounts {
  return img.detections.length || !img.counts ? countClasses(img.detections) : img.counts
}

/** Colonies of a photo rejected as not coral. */
export function imageOthers(img: Pick<ReefImage, "detections" | "others">): number {
  return img.detections.length || img.others == null ? img.detections.filter((d) => finalClass(d) === "OTHERS").length : img.others
}

export const totalOf = (c: ClassCounts) => c.LC + c.PB + c.DC + c.DCA

export function addCounts(a: ClassCounts, b: ClassCounts): ClassCounts {
  return { LC: a.LC + b.LC, PB: a.PB + b.PB, DC: a.DC + b.DC, DCA: a.DCA + b.DCA }
}

export function dominantClass(c: ClassCounts): HealthClass | null {
  if (totalOf(c) === 0) return null
  return HEALTH_CLASSES.reduce((best, k) => (c[k] > c[best] ? k : best), "LC" as HealthClass)
}

/** Share of colonies that are affected (PB + DC + DCA), 0..1 */
export function impactedShare(c: ClassCounts): number {
  const t = totalOf(c)
  return t ? (c.PB + c.DC + c.DCA) / t : 0
}
