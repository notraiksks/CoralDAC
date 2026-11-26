import type { ReefImage } from "./types"

/**
 * V2-0475: one order and one label for quadrat photos everywhere (photo page arrows, station page, map panel).
 * Survey order: survey date, transect (T1 < T2 < T10), quadrat number (photos without a number last), survey photo before an
 * upload with the same number, then the upload time and id (stable).
 */
export function surveyOrder(a: ReefImage, b: ReefImage): number {
  const qa = a.quadrat ?? Number.POSITIVE_INFINITY
  const qb = b.quadrat ?? Number.POSITIVE_INFINITY
  const sa = a.provenance.source === "archive" ? 0 : 1
  const sb = b.provenance.source === "archive" ? 0 : 1
  return (
    a.date.localeCompare(b.date) ||
    compareTransects(a.transect, b.transect) ||
    (qa === qb ? 0 : qa < qb ? -1 : 1) ||
    sa - sb ||
    (a.provenance.uploadedAt ?? "").localeCompare(b.provenance.uploadedAt ?? "") ||
    a.id.localeCompare(b.id)
  )
}

/** T1 < T2 < T10; a photo without a transect ("") last */
export function compareTransects(a: string, b: string): number {
  if (!a || !b) return a === b ? 0 : a ? -1 : 1
  return a.localeCompare(b, undefined, { numeric: true })
}

/** "T2 · Q7"; missing parts are said in words instead of "Q–" */
export function quadratLabel(img: Pick<ReefImage, "transect" | "quadrat">, short = true): string {
  const t = img.transect || "No transect"
  const q = img.quadrat != null ? (short ? `Q${img.quadrat}` : `Quadrat ${img.quadrat}`) : short ? "No quadrat" : "Quadrat not given"
  return `${t} · ${q}`
}

/** quadrat numbers typed by a person: digits only, 1..999, leading zeros dropped ("007" -> 7); null when empty or invalid */
export function parseQuadrat(v: string): number | null {
  if (!/^\d{1,3}$/.test(v.trim())) return null
  const n = Number(v.trim())
  return n >= 1 && n <= 999 ? n : null
}
