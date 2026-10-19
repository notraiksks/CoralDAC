"use client"

/**
 * Thermal heat layer: one quantity per station rendered as a heat field and coloured with the Inferno ramp.
 *
 * 1. On every view change, a scalar field is built on a low-resolution grid: a Gaussian per station, weighted by
 *    value / max (so the hottest station reaches the top of the ramp).
 * 2. Every animation frame the field is resampled through a slowly drifting noise warp ("shimmer") and coloured.
 *    The warp only moves heat by a few pixels and modulates brightness by a few percent; values are not changed
 *    and the static frame (reduced motion / motion off) is the exact field.
 */
import * as React from "react"
import L from "leaflet"
import { useMap, useMapEvents } from "react-leaflet"
import { INFERNO_LUT } from "@/lib/inferno"

export interface HeatPoint {
  lat: number
  lng: number
  /** 0..1, already normalised to the largest value shown */
  w: number
}

/* ---------- smooth value noise ---------- */
function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
function noise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v // 0..1
}

const SCALE = 0.4 // grid resolution relative to screen pixels

export function ThermalLayer({
  points,
  visible,
  animate,
  opacity = 0.82,
  coldFade = 1,
}: {
  points: HeatPoint[]
  visible: boolean
  animate: boolean
  opacity?: number
  /** >1 fades the cold (purple) end out faster, which reads better on light basemaps */
  coldFade?: number
}) {
  const map = useMap()
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const field = React.useRef<{ data: Float32Array; w: number; h: number } | null>(null)
  const frame = React.useRef<ImageData | null>(null)
  const raf = React.useRef<number | null>(null)
  const zooming = React.useRef(false)

  React.useEffect(() => {
    const pane = map.getPane("thermal") ?? map.createPane("thermal")
    pane.style.zIndex = "350"
    pane.style.pointerEvents = "none"
    const canvas = L.DomUtil.create("canvas", "", pane) as HTMLCanvasElement
    canvas.style.position = "absolute"
    canvas.style.transition = "opacity .25s"
    canvas.style.imageRendering = "auto"
    canvasRef.current = canvas
    return () => {
      canvas.remove()
      canvasRef.current = null
    }
  }, [map])

  /** rebuild the scalar field for the current view */
  const build = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = map.getSize()
    const w = Math.ceil(size.x * SCALE)
    const h = Math.ceil(size.y * SCALE)
    canvas.width = w
    canvas.height = h
    canvas.style.width = `${size.x}px`
    canvas.style.height = `${size.y}px`
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]))
    const data = new Float32Array(w * h)
    const lat = map.getCenter().lat
    const metersPerPx = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** map.getZoom()
    const rPx = Math.min(260, Math.max(80, 2000 / metersPerPx))
    for (const p of points) {
      if (p.w <= 0) continue
      const c = map.latLngToContainerPoint([p.lat, p.lng])
      const r = rPx * (0.6 + 0.4 * Math.sqrt(p.w)) * SCALE
      const cx = c.x * SCALE
      const cy = c.y * SCALE
      const s2 = 2 * (r / 2.6) ** 2
      const x0 = Math.max(0, Math.floor(cx - r))
      const x1 = Math.min(w - 1, Math.ceil(cx + r))
      const y0 = Math.max(0, Math.floor(cy - r))
      const y1 = Math.min(h - 1, Math.ceil(cy + r))
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const d2 = (x - cx) ** 2 + (y - cy) ** 2
          if (d2 <= r * r) data[y * w + x] += p.w * Math.exp(-d2 / s2)
        }
    }
    field.current = { data, w, h }
    frame.current = canvas.getContext("2d")!.createImageData(w, h)
  }, [map, points])

  /** colour the field into the canvas; t = seconds, or null for the exact static field */
  const paint = React.useCallback(
    (t: number | null) => {
      const canvas = canvasRef.current
      const f = field.current
      const img = frame.current
      if (!canvas || !f || !img) return
      const ctx = canvas.getContext("2d")!
      const out = img.data
      out.fill(0)
      if (visible) {
        const { data, w, h } = f
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let sx = x
            let sy = y
            let gain = 1
            if (t != null && data[y * w + x] > 0.004) {
              // two drifting octaves: a slow swirl that displaces heat, and a faster flicker of brightness
              const n1 = noise(x * 0.035 + t * 0.12, y * 0.035 - t * 0.09)
              const n2 = noise(x * 0.035 - t * 0.1 + 31.7, y * 0.035 + t * 0.07 + 11.3)
              sx = Math.min(w - 1, Math.max(0, x + (n1 - 0.5) * 11))
              sy = Math.min(h - 1, Math.max(0, y + (n2 - 0.5) * 11))
              gain = 0.88 + 0.24 * noise(x * 0.09 + t * 0.35, y * 0.09 + t * 0.25)
            }
            // bilinear sample of the field
            const xi = Math.floor(sx)
            const yi = Math.floor(sy)
            const fx = sx - xi
            const fy = sy - yi
            const i = yi * w + xi
            const a = data[i]
            const b = xi + 1 < w ? data[i + 1] : a
            const c = yi + 1 < h ? data[i + w] : a
            const d = xi + 1 < w && yi + 1 < h ? data[i + w + 1] : a
            const v = Math.min(1, (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * gain)
            if (v < 0.01) continue
            const k = Math.round(v * 255) * 3
            const o = (y * w + x) * 4
            out[o] = INFERNO_LUT[k]
            out[o + 1] = INFERNO_LUT[k + 1]
            out[o + 2] = INFERNO_LUT[k + 2]
            // fade the cold end out so the basemap shows through; hot cores are nearly opaque
            out[o + 3] = 255 * opacity * Math.min(1, Math.pow(v / 0.5, coldFade))
          }
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    [visible, opacity, coldFade]
  )

  const reducedMotion = React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)")
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  )
  const moving = animate && visible && !reducedMotion

  // animation loop (~24 fps is plenty for a slow shimmer)
  React.useEffect(() => {
    build()
    paint(moving ? performance.now() / 1000 : null)
    if (!moving) return
    let last = 0
    const loop = (now: number) => {
      raf.current = requestAnimationFrame(loop)
      if (zooming.current || now - last < 42) return
      last = now
      paint(now / 1000)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current)
    }
  }, [build, paint, moving])

  const redraw = () => {
    build()
    paint(moving ? performance.now() / 1000 : null)
  }
  useMapEvents({
    moveend: redraw,
    resize: redraw,
    zoomstart: () => {
      zooming.current = true
      if (canvasRef.current) canvasRef.current.style.opacity = "0"
    },
    zoomend: () => {
      zooming.current = false
      redraw()
      if (canvasRef.current) canvasRef.current.style.opacity = "1"
    },
  })
  return null
}
