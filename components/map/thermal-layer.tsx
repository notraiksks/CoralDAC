"use client"

/**
 * Thermal heat layer, drawn on the GPU (WebGL fragment shader).
 *
 * - Each station is a disc (flat core at the exact value, soft edge) whose size is a fixed geographic footprint (FOOTPRINT_M, never smaller than
 *   MIN_RADIUS_PX on screen), so the map does not suggest data between stations.
 * - Overlapping discs combine by MAX, never by sum: a cluster of low stations stays low.
 * - Colour comes from the same ramp lookup table as the legend (lib/heat-ramp.ts).
 * - Optional motion: the sampling position is warped by smooth simplex noise that drifts with time, and the
 *   brightness breathes between 90 % and 100 %. Motion can only lower a value, never raise it above the data.
 * Without WebGL a static CPU rendering of the same field is used.
 */
import * as React from "react"
import L from "leaflet"
import { useMap, useMapEvents } from "react-leaflet"
import { heatLut, type HeatRampId } from "@/lib/heat-ramp"

export interface HeatPoint {
  lat: number
  lng: number
  /** 0..1 on the legend scale */
  w: number
}

const FOOTPRINT_M = 300
const MIN_RADIUS_PX = 62
const MAX_POINTS = 64

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 u_res;        // canvas size in CSS px
uniform float u_dpr;
uniform float u_time;
uniform float u_motion;    // 0 = still, 1 = moving
uniform float u_opacity;
uniform float u_coldFade;
uniform vec4 u_pts[${MAX_POINTS}]; // x, y (CSS px, top-left origin), radius px, weight 0..1
uniform int u_n;
uniform sampler2D u_lut;

// 2D simplex noise, after Ashima Arts / Ian McEwan (MIT licence)
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g); // -1..1
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y * u_dpr - gl_FragCoord.y) / u_dpr;
  float t = u_time;
  float f = 0.0;
  for (int i = 0; i < ${MAX_POINTS}; i++) {
    if (i >= u_n) break;
    vec4 s = u_pts[i];
    vec2 q = p - s.xy;
    if (u_motion > 0.5) {
      // slow, smooth swirl: displacement up to ~18 % of the disc radius
      vec2 nq = q / s.z * 0.9 + float(i) * 13.7;
      vec2 warp = vec2(snoise(nq + vec2(t * 0.11, -t * 0.08)), snoise(nq + vec2(-t * 0.09, t * 0.12) + 31.4));
      q += warp * s.z * 0.18;
    }
    float d = length(q) / s.z;
    f = max(f, s.w * (1.0 - smoothstep(0.35, 1.0, d))); // flat core at the exact value, soft edge; MAX, not sum
  }
  if (u_motion > 0.5) f *= 0.9 + 0.1 * (0.5 + 0.5 * snoise(p * 0.008 + vec2(t * 0.2, t * 0.15)));
  f = clamp(f, 0.0, 1.0);
  if (f < 0.012) discard;
  vec3 col = texture2D(u_lut, vec2((f * 255.0 + 0.5) / 256.0, 0.5)).rgb;
  float a = u_opacity * min(1.0, pow(f / 0.5, u_coldFade));
  gl_FragColor = vec4(col * a, a); // premultiplied alpha
}
`

interface GL {
  gl: WebGLRenderingContext
  loc: Record<string, WebGLUniformLocation | null>
}

function initGl(canvas: HTMLCanvasElement): GL | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true })
  if (!gl) return null
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("[thermal] shader:", gl.getShaderInfoLog(sh))
      return null
    }
    return sh
  }
  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, "a_pos")
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  // colour lookup table as a 256 x 1 texture (same table as the legend); filled by uploadLut()
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const names = ["u_res", "u_dpr", "u_time", "u_motion", "u_opacity", "u_coldFade", "u_pts", "u_n", "u_lut"]
  const loc = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)]))
  gl.uniform1i(loc.u_lut, 0)
  return { gl, loc }
}

function uploadLut(gl: WebGLRenderingContext, lut: Uint8ClampedArray) {
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(lut))
}

type Disc = readonly [x: number, y: number, r: number, w: number]

export function ThermalLayer({
  points,
  visible,
  animate,
  opacity = 0.6,
  coldFade = 1,
  ramp = "warm",
}: {
  points: HeatPoint[]
  visible: boolean
  animate: boolean
  opacity?: number
  /** >1 fades the cold (purple) end out faster, which reads better on light basemaps */
  coldFade?: number
  ramp?: HeatRampId
}) {
  const map = useMap()
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const glRef = React.useRef<GL | null>(null)
  const [hasGl, setHasGl] = React.useState(false)
  const zooming = React.useRef(false)
  const rampRef = React.useRef(ramp)

  // new ramp -> new lookup texture (the render effect below redraws because `ramp` is in its deps)
  React.useEffect(() => {
    rampRef.current = ramp
    const g = glRef.current
    if (g) uploadLut(g.gl, heatLut(ramp))
  }, [ramp])

  React.useEffect(() => {
    const pane = map.getPane("thermal") ?? map.createPane("thermal")
    pane.style.zIndex = "350"
    pane.style.pointerEvents = "none"
    const canvas = L.DomUtil.create("canvas", "", pane) as HTMLCanvasElement
    canvas.style.position = "absolute"
    canvas.style.transition = "opacity .25s"
    canvasRef.current = canvas
    glRef.current = initGl(canvas)
    if (glRef.current) uploadLut(glRef.current.gl, heatLut(rampRef.current))
    setHasGl(glRef.current != null)
    return () => {
      glRef.current?.gl.getExtension("WEBGL_lose_context")?.loseContext()
      glRef.current = null
      canvas.remove()
      canvasRef.current = null
    }
  }, [map])

  const reducedMotion = React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)")
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  )
  const moving = animate && visible && !reducedMotion && hasGl

  /** screen-space discs for the current view */
  const discs = React.useCallback((): Disc[] => {
    const lat = map.getCenter().lat
    const metersPerPx = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** map.getZoom()
    const r = Math.max(MIN_RADIUS_PX, FOOTPRINT_M / metersPerPx)
    return points
      .filter((p) => p.w > 0)
      .slice(0, MAX_POINTS)
      .map((p) => {
        const c = map.latLngToContainerPoint([p.lat, p.lng])
        return [c.x, c.y, r, p.w] as const
      })
  }, [map, points])

  const render = React.useCallback(
    (time: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const size = map.getSize()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.round(size.x * dpr)
      const h = Math.round(size.y * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        canvas.style.width = `${size.x}px`
        canvas.style.height = `${size.y}px`
      }
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]))
      const d = visible ? discs() : []
      const g = glRef.current
      if (!g) {
        renderCpu(canvas, d, size.x, size.y, opacity, coldFade, heatLut(ramp))
        return
      }
      const { gl, loc } = g
      gl.viewport(0, 0, w, h)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (!d.length) return
      const flat = new Float32Array(MAX_POINTS * 4)
      d.forEach((p, i) => flat.set(p, i * 4))
      gl.uniform2f(loc.u_res, size.x, size.y)
      gl.uniform1f(loc.u_dpr, dpr)
      gl.uniform1f(loc.u_time, time)
      gl.uniform1f(loc.u_motion, moving ? 1 : 0)
      gl.uniform1f(loc.u_opacity, opacity)
      gl.uniform1f(loc.u_coldFade, coldFade)
      gl.uniform4fv(loc.u_pts, flat)
      gl.uniform1i(loc.u_n, d.length)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    },
    [map, discs, visible, moving, opacity, coldFade, ramp]
  )

  // continuous loop while moving (the GPU does the work), a single draw otherwise
  React.useEffect(() => {
    render(performance.now() / 1000)
    if (!moving) return
    let id = 0
    const loop = (now: number) => {
      id = requestAnimationFrame(loop)
      if (!zooming.current) render(now / 1000)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [render, moving])

  const redraw = () => render(performance.now() / 1000)
  useMapEvents({
    move: redraw,
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

/** Static fallback without WebGL: the same field (max of discs, same ramp), no motion. */
function renderCpu(
  canvas: HTMLCanvasElement,
  discs: Disc[],
  cssW: number,
  cssH: number,
  opacity: number,
  coldFade: number,
  lut: Uint8ClampedArray
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const scale = 0.5 // half resolution is enough for a smooth field
  const w = Math.ceil(cssW * scale)
  const h = Math.ceil(cssH * scale)
  const img = ctx.createImageData(w, h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let f = 0
      for (const [cx, cy, r, wt] of discs) {
        const d = Math.sqrt((x / scale - cx) ** 2 + (y / scale - cy) ** 2) / r
        if (d < 1) {
          const u = Math.min(1, Math.max(0, (d - 0.35) / 0.65))
          f = Math.max(f, wt * (1 - u * u * (3 - 2 * u)))
        }
      }
      if (f < 0.012) continue
      const k = Math.round(Math.min(1, f) * 255) * 3
      const o = (y * w + x) * 4
      img.data[o] = lut[k]
      img.data[o + 1] = lut[k + 1]
      img.data[o + 2] = lut[k + 2]
      img.data[o + 3] = 255 * opacity * Math.min(1, Math.pow(f / 0.5, coldFade))
    }
  const off = document.createElement("canvas")
  off.width = w
  off.height = h
  off.getContext("2d")!.putImageData(img, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height)
}
