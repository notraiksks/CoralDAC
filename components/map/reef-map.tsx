"use client"

/**
 * Leaflet map of the monitoring stations.
 * - Heatmap: a thermal disc per station (color ramp from lib/heat-ramp.ts) on the GPU (thermal-layer.tsx): the % of affected colonies (PB + DC + DCA), or a
 *   count (per quadrat or station total). Discs have a fixed ~300 m footprint and combine by max, not sum.
 * - Markers: a donut of the full class mix per station. Markers that would overlap get a schematic pixel offset
 *   with a leader line to the GPS point; stored coordinates and counts are never changed.
 */
import * as React from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { GeoJSON, MapContainer, Marker, Pane, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet"
import land from "@/lib/data/sea-land.json"
import { CLASS_META, HEALTH_CLASSES } from "@/lib/classes"
import { fmt1, formatHeat, heatMax, heatValue, type HeatMetric, type HeatTarget, type StationSummary } from "@/lib/stats"
import { ThermalLayer } from "./thermal-layer"
import { HEAT_RAMPS, type HeatRampId } from "@/lib/heat-ramp"

export type Basemap = "map" | "satellite"

const LAND = land as unknown as GeoJSON.FeatureCollection

/* ---------------- station markers ---------------- */

function donutSvg(s: StationSummary, size: number, selected: boolean) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  const shown = HEALTH_CLASSES
  const total = s.colonies
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

function stationIcon(s: StationSummary, target: HeatTarget, metric: HeatMetric, offset: [number, number], selected: boolean) {
  const size = selected ? 52 : 44
  const label = formatHeat(heatValue(s, target, metric), target, metric)
  const [dx, dy] = offset
  const html = `
    <div style="position:relative;width:0;height:0">
      ${dx || dy ? `<svg style="position:absolute;left:${Math.min(0, dx)}px;top:${Math.min(0, dy)}px;overflow:visible" width="${Math.abs(dx) || 1}" height="${Math.abs(dy) || 1}"><line x1="${dx < 0 ? -dx : 0}" y1="${dy < 0 ? -dy : 0}" x2="${dx < 0 ? 0 : dx}" y2="${dy < 0 ? 0 : dy}" stroke="var(--foreground)" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="3 2"/></svg>
      <span style="position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:9px;background:var(--foreground);border:2px solid var(--card)"></span>` : ""}
      <div style="position:absolute;left:${dx - size / 2}px;top:${dy - size / 2}px;width:${size}px;height:${size}px;cursor:pointer">
        ${donutSvg(s, size, selected)}
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 ${selected ? 13 : 12}px var(--font-inter),system-ui,sans-serif;color:var(--foreground);font-variant-numeric:tabular-nums">${label}</span>
      </div>
    </div>`
  return L.divIcon({ html, className: "station-pin", iconSize: [0, 0], iconAnchor: [0, 0] })
}

/**
 * Schematic pixel offsets so markers never overlap at the current zoom (proposal: offsets for legibility only).
 * Markers closer than MIN_GAP px are spread on a small ring around their common center, with a leader line
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
    // keep a stable, geographic-ish order: sort by angle from the center, Deep before Shallow on ties
    const ordered = [...g].sort((a, b) => Math.atan2(a.p.y - cy, a.p.x - cx) - Math.atan2(b.p.y - cy, b.p.x - cx) || a.depth.localeCompare(b.depth))
    ordered.forEach((o, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / g.length + (g.length === 2 ? Math.PI / 2 : 0)
      out[o.id] = [Math.round(cx + r * Math.cos(ang) - o.p.x), Math.round(cy + r * Math.sin(ang) - o.p.y)]
    })
  }
  return out
}

function StationMarkers({ summaries, target, metric, selectedId, onSelect }: {
  summaries: StationSummary[]
  target: HeatTarget
  metric: HeatMetric
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const map = useMap()
  const [zoom, setZoom] = React.useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  const offsets = React.useMemo(() => declutter(summaries, map, zoom), [summaries, map, zoom])
  return (
    <>
      {summaries.map((s) => {
        const off = offsets[s.station.id] ?? [0, 0]
        const shifted = off[0] !== 0 || off[1] !== 0
        const selected = selectedId === s.station.id
        return (
          <Marker
            key={`${s.station.id}-${selected}-${metric}-${target}-${s.colonies}-${off.join(",")}`}
            position={[s.station.lat, s.station.lng]}
            icon={stationIcon(s, target, metric, off, selected)}
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
  // Esri canvas basemaps need no API key and keep the thermal colors readable (the Ocean basemap has no data here)
  const base = `Canvas/World_${dark ? "Dark" : "Light"}_Gray_Base`
  const ref = `Canvas/World_${dark ? "Dark" : "Light"}_Gray_Reference`
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
  target: HeatTarget
  metric: HeatMetric
  heatOn: boolean
  animate: boolean
  basemap: Basemap
  dark: boolean
  ramp: HeatRampId
  selectedId: string | null
  onSelect: (id: string) => void
  onReady: (m: L.Map) => void
}

export default function ReefMap({ summaries, target, metric, heatOn, animate, basemap, dark, ramp, selectedId, onSelect, onReady }: ReefMapProps) {
  const bounds = React.useMemo(
    () => L.latLngBounds(summaries.map((s) => [s.station.lat, s.station.lng] as [number, number])).pad(0.35),
    [summaries]
  )

  const points = React.useMemo(() => {
    const max = heatMax(summaries, target, metric)
    return summaries.map((s) => ({ lat: s.station.lat, lng: s.station.lng, w: s.images ? heatValue(s, target, metric) / max : 0 }))
  }, [summaries, target, metric])

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
      <ThermalLayer
        points={points}
        visible={heatOn}
        animate={animate}
        ramp={ramp}
        opacity={dark ? HEAT_RAMPS[ramp].opacity.dark : HEAT_RAMPS[ramp].opacity.light}
        coldFade={dark || basemap === "satellite" ? HEAT_RAMPS[ramp].coldFade.dark : HEAT_RAMPS[ramp].coldFade.light}
      />
      <StationMarkers summaries={summaries} target={target} metric={metric} selectedId={selectedId} onSelect={onSelect} />
      <Bridge onReady={onReady} />
    </MapContainer>
  )
}
