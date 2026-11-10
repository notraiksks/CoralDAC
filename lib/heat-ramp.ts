/**
 * Heatmap color ramp (Rai, 2026-11-10: warm). The heat layer and its legend read the same ramp.
 * Light "semantic heat": pale yellow -> sand -> coral -> deep coral red, no black; low values fade to transparent so the basemap
 * stays readable. Monotone in lightness (light = low, dark = high); its hues sit apart from the PB (#e69f00) and DC (#d55e00)
 * marker colors in lightness and chroma.
 */
export type HeatRampId = "warm"

export interface HeatRamp {
  label: string
  stops: [number, string][]
  /** layer opacity on dark and light basemaps */
  opacity: { dark: number; light: number }
  /** alpha = opacity * min(1, (value / 0.5) ^ coldFade): > 1 fades the low end out faster */
  coldFade: { dark: number; light: number }
}

export const HEAT_RAMPS: Record<HeatRampId, HeatRamp> = {
  warm: {
    label: "Warm",
    stops: [
      [0, "#fff3b0"],
      [0.33, "#fdc96b"],
      [0.66, "#f4895a"],
      [1, "#c8414b"],
    ],
    opacity: { dark: 0.62, light: 0.6 },
    coldFade: { dark: 1.2, light: 1.5 },
  },
}

export const DEFAULT_HEAT_RAMP: HeatRampId = "warm"

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

function colorAt(stops: [number, string][], t: number) {
  let k = 0
  while (k < stops.length - 2 && t > stops[k + 1][0]) k++
  const [t0, c0] = stops[k]
  const [t1, c1] = stops[k + 1]
  const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
  const a = hex(c0)
  const b = hex(c1)
  return a.map((v, j) => Math.round(v + (b[j] - v) * f))
}

const lutCache = new Map<HeatRampId, Uint8ClampedArray>()

/** 256 x RGB lookup table for the shader and the CPU fallback */
export function heatLut(id: HeatRampId = DEFAULT_HEAT_RAMP): Uint8ClampedArray {
  let lut = lutCache.get(id)
  if (!lut) {
    lut = new Uint8ClampedArray(256 * 3)
    for (let i = 0; i < 256; i++) lut.set(colorAt(HEAT_RAMPS[id].stops, i / 255), i * 3)
    lutCache.set(id, lut)
  }
  return lut
}

/** Legend gradient with the same low-end fade as the map (alpha not multiplied by layer opacity, so the bar stays legible). */
export function heatLegendCss(id: HeatRampId, dark: boolean) {
  const ramp = HEAT_RAMPS[id]
  const cf = dark ? ramp.coldFade.dark : ramp.coldFade.light
  const parts = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10
    const [r, g, b] = colorAt(ramp.stops, t)
    const a = Math.min(1, Math.pow(t / 0.5, cf))
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)}) ${t * 100}%`
  })
  return `linear-gradient(90deg, ${parts.join(", ")})`
}
