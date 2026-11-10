import { stationById } from "./archive"
import { countClasses, finalClass, HEALTH_CLASSES } from "./classes"
import type { ReefImage } from "./types"

function esc(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** One row per image with its class-count vector (proposal 4.2.2.6 record layout). */
export function exportImagesCsv(images: ReefImage[], filename: string) {
  const head = ["image_id", "file", "station", "date", "transect", "quadrat", "latitude", "longitude", "status", ...HEALTH_CLASSES.map((k) => `${k}_count`), "others_count", "simulated"]
  const rows = images.map((i) => {
    const c = countClasses(i.detections)
    const others = i.detections.filter((d) => finalClass(d) === "OTHERS").length
    return [i.id, i.file, stationById(i.stationId)?.name ?? "", i.date, i.transect, i.quadrat, i.lat?.toFixed(5) ?? "", i.lng?.toFixed(5) ?? "", i.status, ...HEALTH_CLASSES.map((k) => c[k]), others, i.provenance.simulated ? 1 : 0]
  })
  downloadCsv(filename, [head, ...rows])
}

export function exportDetectionsCsv(img: ReefImage) {
  const head = ["image", "detection", "x", "y", "w", "h", "det_conf", "filter", "filter_conf", "health", "health_conf", "final_class", "reviewed"]
  const rows = img.detections.map((d) => [img.file, d.id, ...d.box.map((v) => v.toFixed(4)), d.detConf, d.filter, d.filterConf, d.health, d.healthConf, finalClass(d), d.reviewed ? 1 : 0])
  downloadCsv(`${img.id}-detections.csv`, [head, ...rows])
}
