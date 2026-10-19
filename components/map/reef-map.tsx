"use client"

/**
 * Leaflet map of the monitoring stations.
 * - Heatmap: one independent layer per health class with a fixed colour (proposal 4.2.2.7); the heat weight at a
 *   station is the chosen metric (colonies per quadrat, or the raw station total), scaled to the largest value shown.
 * - Markers: a donut of the class mix per station. Stations that share a coordinate are drawn with a small
 *   schematic pixel offset (labelled as such); stored coordinates and counts are never changed.
 */
import * as React from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { GeoJSON, MapContainer, Marker, Pane, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet"
import land from "@/lib/data/sea-land.json"
import { CLASS_META, HEALTH_CLASSES } from "@/lib/classes"
import type { HeatMetric, StationSummary } from "@/lib/stats"
import { fmt1 } from "@/lib/stats"
import type { HealthClass } from "@/lib/types"

export type Basemap = "map" | "satellite"
export type Layers = Record<HealthClass, boolean>

const LAND = land as unknown as GeoJSON.FeatureCollection

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888"
}

function rgb(color: string): [number, number, number] {
  const c = document.createElement("canvas").getContext("2d")!
  c.fillStyle = color
  const hex = c.fillStyle as string
  if (hex.startsWith("#")) return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
  const m = hex.match(/\d+/g) ?? ["128", "128", "128"]
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}

export const metricValue = (s: StationSummary, k: HealthClass, metric: HeatMetric) =>
  metric === "total" ? s.totals[k] : s.perQuadrat[k]

/* ---------------- heat layer ---------------- */

function HeatLayer({ summaries, layers, metric, visible, themeKey }: {
  summaries: StationSummary[]
  layers: Layers
  metric: HeatMetric
  visible: boolean
  themeKey: string
}) {
  const map = useMap()
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  React.useEffect(() => {
    const pane = map.getPane("heat") ?? map.createPane("heat")
    pane.style.zIndex = "350"
    pane.style.pointerEvents = "none"
    const canvas = L.DomUtil.create("canvas", "", pane) as HTMLCanvasElement
    canvas.style.position = "absolute"
    canvas.style.transition = "opacity .2s"
    canvasRef.current = canvas
    return () => {
      canvas.remove()
      canvasRef.current = null
    }
  }, [map])

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = map.getSize()
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.x * dpr
    canvas.height = size.y * dpr
    canvas.style.width = `${size.x}px`
    canvas.style.height = `${size.y}px`
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]))
    const ctx = canvas.getContext("2d")!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.x, size.y)
    if (!visible) return

    const shown = HEALTH_CLASSES.filter((k) => layers[k])
    const max = Math.max(1e-9, ...summaries.flatMap((s) => shown.map((k) => metricValue(s, k, metric))))
    const lat = map.getCenter().lat
    const metersPerPx = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** map.getZoom()
    const radius = Math.min(150, Math.max(34, 700 / metersPerPx))
    for (const k of shown) {
      const [r, g, b] = rgb(cssVar(`--${k.toLowerCase()}`))
      for (const s of summaries) {
        const v = metricValue(s, k, metric)
        if (v <= 0) continue
        const p = map.latLngToContainerPoint([s.station.lat, s.station.lng])
        const a = 0.12 + 0.6 * (v / max)
        const rr = radius * (0.55 + 0.45 * Math.sqrt(v / max))
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr)
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`)
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${a * 0.6})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // themeKey is a dependency so colours are re-read after a theme switch
  }, [map, summaries, layers, metric, visible, themeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useMapEvents({
    move: draw,
    resize: draw,
    zoomstart: () => canvasRef.current && (canvasRef.current.style.opacity = "0"),
    zoomend: () => {
      draw()
      if (canvasRef.current) canvasRef.current.style.opacity = "1"
    },
  })
  React.useEffect(draw, [draw])
  return null
}

/* ---------------- station markers ---------------- */

function donutSvg(s: StationSummary, layers: Layers, size: number, selected: boolean) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  const shown = HEALTH_CLASSES.filter((k) => layers[k])
  const total = shown.reduce((a, k) => a + s.totals[k], 0)
  let offset = 0
  const arcs = total
    ? shown
        .map((k) => {
          const len = (s.totals[k] / total) * c
          const seg = `<circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="${CLASS_META[k].color}" stroke-width="6" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`
          offset += len
          return seg
        })
        .join("")
    : `<circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="var(--others)" stroke-width="6"/>`
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;filter:drop-shadow(0 3px 6px rgb(0 0 0 / .35))">
    ${selected ? `<circle r="${size / 2 + 4}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="var(--primary)" stroke-width="3"/>` : ""}
    <circle r="${r + 3}" cx="${size / 2}" cy="${size / 2}" fill="var(--card)"/>
    ${arcs}
  </svg>`
}

function stationIcon(s: StationSummary, layers: Layers, metric: HeatMetric, offset: [number, number], selected: boolean) {
  const size = selected ? 52 : 44
  const shown = HEALTH_CLASSES.filter((k) => layers[k])
  const value = shown.reduce((a, k) => a + metricValue(s, k, metric), 0)
  const label = metric === "total" ? String(Math.round(value)) : fmt1(value)
  const [dx, dy] = offset
  const html = `
    <div style="position:relative;width:0;height:0">
      ${dx || dy ? `<svg style="position:absolute;left:${Math.min(0, dx)}px;top:${Math.min(0, dy)}px;overflow:visible" width="${Math.abs(dx) || 1}" height="${Math.abs(dy) || 1}"><line x1="${dx < 0 ? -dx : 0}" y1="${dy < 0 ? -dy : 0}" x2="${dx < 0 ? 0 : dx}" y2="${dy < 0 ? 0 : dy}" stroke="var(--foreground)" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="3 2"/></svg>
      <span style="position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:9px;background:var(--foreground);border:2px solid var(--card)"></span>` : ""}
      <div style="position:absolute;left:${dx - size / 2}px;top:${dy - size / 2}px;width:${size}px;height:${size}px;cursor:pointer">
        ${donutSvg(s, layers, size, selected)}
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 ${selected ? 13 : 12}px var(--font-inter),system-ui,sans-serif;color:var(--foreground);font-variant-numeric:tabular-nums">${label}</span>
      </div>
    </div>`
  return L.divIcon({ html, className: "station-pin", iconSize: [0, 0], iconAnchor: [0, 0] })
}

/**
 * Schematic pixel offsets so markers never overlap at the current zoom (proposal: offsets for legibility only).
 * Markers closer than MIN_GAP px are spread on a small ring around their common centre, with a leader line
 * back to the true GPS point.
 */
const MIN_GAP = 52
function declutter(summaries: StationSummary[], map: L.Map, zoom: number): Record<string, [number, number]> {
  const pts = summaries.map((s) => ({ id: s.station.id, depth: s.station.depth, p: map.project([s.station.lat, s.station.lng], zoom) }))
  const groups: (typeof pts)[] = []
  for (const pt of pts) {
    const g = groups.find((gr) => gr.some((o) => o.p.distanceTo(pt.p) < MIN_GAP))
    if (g) g.push(pt)
    else groups.push([pt])
  }
  const out: Record<string, [number, number]> = {}
  for (const g of groups) {
    if (g.length === 1) {
      out[g[0].id] = [0, 0]
      continue
    }
    const cx = g.reduce((a, o) => a + o.p.x, 0) / g.length
    const cy = g.reduce((a, o) => a + o.p.y, 0) / g.length
    const r = Math.max(34, (MIN_GAP * g.length) / (2 * Math.PI) + 6)
    // keep a stable, geographic-ish order: sort by angle from the centre, Deep before Shallow on ties
    const ordered = [...g].sort((a, b) => Math.atan2(a.p.y - cy, a.p.x - cx) - Math.atan2(b.p.y - cy, b.p.x - cx) || a.depth.localeCompare(b.depth))
    ordered.forEach((o, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / g.length + (g.length === 2 ? Math.PI / 2 : 0)
      out[o.id] = [Math.round(cx + r * Math.cos(ang) - o.p.x), Math.round(cy + r * Math.sin(ang) - o.p.y)]
    })
  }
  return out
}

function StationMarkers({ summaries, layers, metric, selectedId, onSelect }: {
  summaries: StationSummary[]
  layers: Layers
  metric: HeatMetric
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const map = useMap()
  const [zoom, setZoom] = React.useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  const offsets = React.useMemo(() => declutter(summaries, map, zoom), [summaries, map, zoom])
  const layerKey = HEALTH_CLASSES.map((k) => +layers[k]).join("")
  return (
    <>
      {summaries.map((s) => {
        const off = offsets[s.station.id] ?? [0, 0]
        const shifted = off[0] !== 0 || off[1] !== 0
        const selected = selectedId === s.station.id
        return (
          <Marker
            key={`${s.station.id}-${selected}-${metric}-${layerKey}-${s.colonies}-${off.join(",")}`}
            position={[s.station.lat, s.station.lng]}
            icon={stationIcon(s, layers, metric, off, selected)}
            zIndexOffset={selected ? 1000 : 0}
            keyboard
            title={s.station.name}
            alt={`${s.station.name}: ${s.colonies} colonies in ${s.images} quadrats`}
            eventHandlers={{
              click: () => onSelect(s.station.id),
              keypress: (e) => (e.originalEvent as KeyboardEvent).key === "Enter" && onSelect(s.station.id),
            }}
          >
            <Tooltip direction="top" offset={[off[0], off[1] - 28]} className="station-tip">
              <div className="font-medium">{s.station.name}</div>
              <div className="tabular text-muted-foreground">
                {s.colonies} colonies · {s.images} quadrats · {fmt1(s.colonies / Math.max(1, s.images))}/quadrat
              </div>
              {shifted && <div className="mt-1 text-[11px] text-muted-foreground">Marker moved for legibility; the dot marks its GPS point.</div>}
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}

/* ---------------- tiles ---------------- */

function Tiles({ basemap, dark }: { basemap: Basemap; dark: boolean }) {
  if (basemap === "satellite")
    return (
      <>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
          maxNativeZoom={18}
          maxZoom={19}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={18}
          maxZoom={19}
          opacity={0.85}
        />
      </>
    )
  // Esri basemaps need no API key; Ocean shows bathymetry, Dark Gray suits dark mode
  const base = dark ? "Canvas/World_Dark_Gray_Base" : "Ocean/World_Ocean_Base"
  const ref = dark ? "Canvas/World_Dark_Gray_Reference" : "Ocean/World_Ocean_Reference"
  return (
    <>
      <TileLayer
        key={base}
        url={`https://server.arcgisonline.com/ArcGIS/rest/services/${base}/MapServer/tile/{z}/{y}/{x}`}
        attribution="Tiles &copy; Esri, GEBCO, NOAA, Garmin, HERE"
        maxNativeZoom={16}
        maxZoom={19}
      />
      <TileLayer key={ref} url={`https://server.arcgisonline.com/ArcGIS/rest/services/${ref}/MapServer/tile/{z}/{y}/{x}`} maxNativeZoom={16} maxZoom={19} />
    </>
  )
}

function Bridge({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  React.useEffect(() => onReady(map), [map, onReady])
  return null
}

export interface ReefMapProps {
  summaries: StationSummary[]
  layers: Layers
  metric: HeatMetric
  heatOn: boolean
  basemap: Basemap
  dark: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onReady: (m: L.Map) => void
}

export default function ReefMap({ summaries, layers, metric, heatOn, basemap, dark, selectedId, onSelect, onReady }: ReefMapProps) {
  const bounds = React.useMemo(
    () => L.latLngBounds(summaries.map((s) => [s.station.lat, s.station.lng] as [number, number])).pad(0.35),
    [summaries]
  )

  return (
    <MapContainer
      bounds={bounds}
      // keep stations clear of the floating layers card on wide screens
      boundsOptions={{ paddingTopLeft: [typeof window !== "undefined" && window.innerWidth >= 768 ? 340 : 0, 40] }}
      zoomControl={false} minZoom={5} maxZoom={19} className="absolute inset-0 z-0 h-full w-full">
      <Pane name="land" style={{ zIndex: 150 }}>
        <GeoJSON
          data={LAND}
          interactive={false}
          style={() => ({ fillColor: dark ? "#2a3442" : "#eef0ea", fillOpacity: 1, color: dark ? "#4a5566" : "#b9bcae", weight: 0.8 })}
        />
      </Pane>
      <Tiles basemap={basemap} dark={dark} />
      <HeatLayer summaries={summaries} layers={layers} metric={metric} visible={heatOn} themeKey={dark ? "d" : "l"} />
      <StationMarkers summaries={summaries} layers={layers} metric={metric} selectedId={selectedId} onSelect={onSelect} />
      <Bridge onReady={onReady} />
    </MapContainer>
  )
}
