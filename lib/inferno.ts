/** Inferno colour ramp (matplotlib): perceptually uniform and colour-blind friendly; reads as a thermal camera. */
const INFERNO_STOPS: [number, string][] = [
  [0, "#000004"],
  [0.125, "#1b0c41"],
  [0.25, "#4a0c6b"],
  [0.375, "#781c6d"],
  [0.5, "#a52c60"],
  [0.625, "#cf4446"],
  [0.75, "#ed6925"],
  [0.875, "#fb9b06"],
  [0.94, "#f7d13d"],
  [1, "#fcffa4"],
]

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

export const INFERNO_LUT: Uint8ClampedArray = (() => {
  const lut = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    let k = 0
    while (k < INFERNO_STOPS.length - 2 && t > INFERNO_STOPS[k + 1][0]) k++
    const [t0, c0] = INFERNO_STOPS[k]
    const [t1, c1] = INFERNO_STOPS[k + 1]
    const f = (t - t0) / (t1 - t0)
    const a = hex(c0)
    const b = hex(c1)
    for (let j = 0; j < 3; j++) lut[i * 3 + j] = a[j] + (b[j] - a[j]) * f
  }
  return lut
})()

export const INFERNO_CSS = `linear-gradient(90deg, ${INFERNO_STOPS.map(([t, c]) => `${c} ${t * 100}%`).join(", ")})`
