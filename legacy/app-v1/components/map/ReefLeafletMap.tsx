'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { StationData, MapFilters, QuadratRecord } from '../../types';

export type Basemap = 'dark' | 'satellite';
type ClassKey = 'lc' | 'pb' | 'dc' | 'dca';
const CLASS_ORDER: ClassKey[] = ['lc', 'pb', 'dc', 'dca'];

export const CLASS_COLOR: Record<ClassKey, string> = {
  lc: '#FF6F4D',
  pb: '#F2BF7D',
  dc: '#B9B3A4',
  dca: '#6C8B4E',
};

const TILES: Record<Basemap, { url: string; attribution: string; maxZoom: number }> = {
  dark: {
    // Plain OpenStreetMap tiles (no API key); darkened via CSS in globals.css (.reef-tiles-dark).
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
};

// Zoom level used when drilling into a single station.
export const DRILL_ZOOM = 14;
// Below this zoom the drill-in state is dropped automatically.
const DRILL_EXIT_ZOOM = 11;

function dominantClass(station: StationData, layers: MapFilters['layers']): ClassKey {
  const entries: [ClassKey, number][] = CLASS_ORDER.map((k) => [k, layers[k] ? station.health[k] : -1]);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function secondaryClass(station: StationData, layers: MapFilters['layers'], dom: ClassKey): ClassKey {
  const entries: [ClassKey, number][] = CLASS_ORDER.filter((k) => k !== dom && layers[k]).map((k) => [
    k,
    station.health[k],
  ]);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? dom;
}

function quadratDominant(q: QuadratRecord): ClassKey {
  const vals: [ClassKey, number][] = [
    ['lc', q.coverLC],
    ['pb', q.coverPB],
    ['dc', q.coverDC],
    ['dca', q.coverDCA],
  ];
  vals.sort((a, b) => b[1] - a[1]);
  return vals[0][0];
}

function activeSum(health: StationData['health'], layers: MapFilters['layers']): number {
  return CLASS_ORDER.reduce((s, k) => s + (layers[k] ? health[k] : 0), 0);
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- heat colour ramp ----------
const HEAT_LOW: [number, number, number] = [79, 163, 126];
const HEAT_MID: [number, number, number] = [242, 191, 125];
const HEAT_HIGH: [number, number, number] = [224, 82, 61];
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
function heatColor(t: number): [number, number, number] {
  const [a, b, tt] = t < 0.5 ? [HEAT_LOW, HEAT_MID, t / 0.5] : [HEAT_MID, HEAT_HIGH, (t - 0.5) / 0.5];
  return [lerp(a[0], b[0], tt), lerp(a[1], b[1], tt), lerp(a[2], b[2], tt)];
}

// ---------- icons ----------
function clusterIcon(station: StationData, filters: MapFilters, hidden: boolean): L.DivIcon {
  const dom = dominantClass(station, filters.layers);
  const sec = secondaryClass(station, filters.layers, dom);
  const shadow = 'box-shadow:0 6px 16px rgba(0,0,0,.45);border-radius:9px !important;';
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;opacity:${hidden ? 0 : 1};pointer-events:${hidden ? 'none' : 'auto'};transition:opacity .25s">
      <div style="position:relative;width:54px;height:54px">
        <div style="position:absolute;width:40px;height:40px;top:0;left:6px;opacity:.55;background:${CLASS_COLOR[sec]};transform:rotate(-6deg);${shadow}"></div>
        <div style="position:absolute;width:40px;height:40px;top:3px;left:12px;opacity:.8;background:${CLASS_COLOR[dom]};transform:rotate(4deg);${shadow}"></div>
        <div style="position:absolute;width:40px;height:40px;top:7px;left:9px;background:${CLASS_COLOR[dom]};${shadow}"></div>
        <div style="position:absolute;top:-6px;right:-6px;min-width:21px;height:21px;padding:0 6px;border-radius:999px !important;background:#F3ECDC;color:#0A2830;font:700 11.5px 'Space Grotesk',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4)">${station.quadratsCount}</div>
      </div>
      <span style="font:500 11px Inter,system-ui,sans-serif;color:#F3ECDC;white-space:nowrap;text-shadow:0 1px 4px rgba(0,0,0,.8), 0 0 8px rgba(0,0,0,.6)">${escapeHtml(station.name)}</span>
    </div>`;
  return L.divIcon({ html, className: 'reef-cluster-icon', iconSize: [54, 78], iconAnchor: [27, 30] });
}

function quadratIcon(color: string, dim: boolean): L.DivIcon {
  const html = `<div style="width:26px;height:26px;border-radius:8px !important;background:${color};opacity:${dim ? 0.2 : 1};box-shadow:0 4px 12px rgba(0,0,0,.5), inset 0 0 0 2px rgba(10,40,48,.85)"></div>`;
  return L.divIcon({ html, className: 'reef-quadrat-icon', iconSize: [26, 26], iconAnchor: [13, 13] });
}

// ---------- canvas heat overlay synced to the map ----------
const HeatOverlay: React.FC<{
  stations: StationData[];
  filters: MapFilters;
  visible: boolean;
}> = ({ stations, filters, visible }) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // create the canvas once inside its own pane (above tiles, below markers)
  useEffect(() => {
    const paneName = 'reefHeatPane';
    const pane = map.getPane(paneName) ?? map.createPane(paneName);
    pane.style.zIndex = '350';
    pane.style.pointerEvents = 'none';
    const canvas = L.DomUtil.create('canvas', 'reef-heat-canvas', pane) as HTMLCanvasElement;
    canvas.style.position = 'absolute';
    canvas.style.transition = 'opacity .3s';
    canvasRef.current = canvas;
    return () => {
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map]);

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = map.getSize();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    // keep the canvas pinned to the viewport while the map pane moves
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);
    ctx.globalCompositeOperation = 'lighter';

    const zoom = map.getZoom();
    const baseOpacity = Math.max(filters.heatmapIntensity, 10) / 100;

    stations.forEach((station) => {
      const total = activeSum(station.health, filters.layers);
      if (total <= 0) return;
      const stress =
        CLASS_ORDER.filter((k) => k !== 'lc' && filters.layers[k]).reduce((s, k) => s + station.health[k], 0) /
        total;
      const [r, g, b] = heatColor(stress);
      const pt = map.latLngToContainerPoint([station.lat, station.lng]);
      // radius in real-world metres -> pixels at this latitude/zoom
      const metersPerPixel = (40075016.686 * Math.cos((station.lat * Math.PI) / 180)) / Math.pow(2, zoom + 8);
      const radiusMeters = 20000 + Math.sqrt(total) * 2500 + station.quadratsCount * 250;
      const radius = Math.min(Math.max(radiusMeters / metersPerPixel, 44), 560);

      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.75 * baseOpacity})`);
      grad.addColorStop(0.55, `rgba(${r},${g},${b},${0.32 * baseOpacity})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [map, stations, filters]);

  useMapEvents({
    move: draw,
    zoom: draw,
    zoomend: draw,
    resize: draw,
  });

  useEffect(() => {
    draw();
  }, [draw, visible]);

  useEffect(() => {
    if (canvasRef.current) canvasRef.current.style.opacity = visible ? '1' : '0';
  }, [visible]);

  return null;
};

// ---------- map events bridge ----------
const MapBridge: React.FC<{
  onReady: (map: L.Map) => void;
  drilledStationId: string | null;
  onDrillExit: () => void;
}> = ({ onReady, drilledStationId, onDrillExit }) => {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  useMapEvents({
    zoomend: () => {
      if (drilledStationId && map.getZoom() < DRILL_EXIT_ZOOM) onDrillExit();
    },
  });
  return null;
};

interface ReefLeafletMapProps {
  stations: StationData[];
  filters: MapFilters;
  mode: 'clusters' | 'heatmap';
  basemap: Basemap;
  drilledStationId: string | null;
  onSelectStation: (id: string) => void;
  onOpenStationDetail: () => void;
  onMapReady: (map: L.Map) => void;
  onDrillExit: () => void;
}

export const PH_CENTER: [number, number] = [11.2, 123.0];

const ReefLeafletMap: React.FC<ReefLeafletMapProps> = ({
  stations,
  filters,
  mode,
  basemap,
  drilledStationId,
  onSelectStation,
  onOpenStationDetail,
  onMapReady,
  onDrillExit,
}) => {
  const tile = TILES[basemap];
  const drilled = drilledStationId ? stations.find((s) => s.id === drilledStationId) ?? null : null;

  const bounds = useMemo(() => {
    if (stations.length === 0) return L.latLngBounds([[4.5, 116.5], [21.5, 127]]);
    return L.latLngBounds(stations.map((s) => [s.lat, s.lng] as [number, number])).pad(0.25);
  }, [stations]);

  // Deterministic ring of quadrat pins around the drilled station (~120-250 m).
  const quadratPins = useMemo(() => {
    if (!drilled) return [];
    const n = Math.max(drilled.quadrats.length, 1);
    return drilled.quadrats.map((q, i) => {
      const angle = (i / n) * Math.PI * 2;
      const rDeg = 0.0011 + (i % 3) * 0.0004;
      return {
        q,
        pos: [drilled.lat + Math.sin(angle) * rDeg * 0.8, drilled.lng + Math.cos(angle) * rDeg] as [number, number],
      };
    });
  }, [drilled]);

  return (
    <MapContainer
      bounds={bounds}
      zoomControl={false}
      minZoom={5}
      maxZoom={tile.maxZoom}
      worldCopyJump={false}
      className="reef-leaflet absolute inset-0 w-full h-full"
      style={{ background: '#0A2830' }}
    >
      <TileLayer key={basemap} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} className={basemap === 'dark' ? 'reef-tiles-dark' : ''} />

      <MapBridge onReady={onMapReady} drilledStationId={drilledStationId} onDrillExit={onDrillExit} />
      <HeatOverlay stations={stations} filters={filters} visible={mode === 'heatmap'} />

      {stations.map((station) => (
        <Marker
          key={`${station.id}-${mode}-${drilledStationId === station.id}-${JSON.stringify(filters.layers)}`}
          position={[station.lat, station.lng]}
          icon={clusterIcon(station, filters, mode === 'heatmap' || drilledStationId === station.id)}
          interactive={mode === 'clusters' && drilledStationId !== station.id}
          zIndexOffset={500}
          eventHandlers={{ click: () => onSelectStation(station.id) }}
        />
      ))}

      {quadratPins.map(({ q, pos }) => {
        const dom = quadratDominant(q);
        const dim = q.confidence * 100 < filters.detectionConfidence || !filters.layers[dom];
        return (
          <Marker
            key={q.id}
            position={pos}
            icon={quadratIcon(CLASS_COLOR[dom], dim)}
            title={`${q.id} · ${dom.toUpperCase()} · confidence ${q.confidence.toFixed(2)}`}
            zIndexOffset={600}
            eventHandlers={{ click: () => onOpenStationDetail() }}
          />
        );
      })}
    </MapContainer>
  );
};

export default ReefLeafletMap;
