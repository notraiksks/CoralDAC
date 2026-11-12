"use client"

/**
 * Per-photo detail that is NOT shipped with every page (V2-0381, speed): the SAM outlines of the example photos live in
 * public/demo/masks/<id>.json (scripts/split_archive.mjs) and are fetched when that photo is opened.
 */
import * as React from "react"
import type { ReefImage } from "./types"

export type MaskMap = Record<string, [number, number][]>

/** Outline cache for the example photos: [masks by photo id, load(id)]. */
export function useArchiveMasks(): [Record<string, MaskMap>, (id: string) => void] {
  const [masks, setMasks] = React.useState<Record<string, MaskMap>>({})
  const asked = React.useRef(new Set<string>())
  const load = React.useCallback((id: string) => {
    if (asked.current.has(id)) return
    asked.current.add(id)
    fetch(`/demo/masks/${encodeURIComponent(id)}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<MaskMap>) : {}))
      .then((m) => setMasks((all) => ({ ...all, [id]: m })))
      .catch(() => asked.current.delete(id))
  }, [])
  return [masks, load]
}

/** The photo with its outlines filled in, when they have been loaded. */
export function withMasks(img: ReefImage, masks: MaskMap | undefined): ReefImage {
  if (!masks) return img
  return { ...img, detections: img.detections.map((d) => (d.mask || !masks[d.id] ? d : { ...d, mask: masks[d.id] })) }
}
