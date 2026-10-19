'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster, { type ClusterProperties } from 'supercluster';
import { GeoJSON, MapContainer, Marker, Pane, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import land from '../data/seaLand.json';
import { CLASS_META, ReefImage } from '../lib/types';
import { dominantOf } from '../lib/reefMath';
import { getThumbSrc } from '../lib/imageArt';

export type Basemap = 'satellite' | 'sentinel' | 'nasa' | 'street' | 'outline';
type OnlineBase = Exclude<Basemap, 'outline'>;

export interface HeatPoint {
  lat: number;
  lng: number;
  rgb: [number, number, number];
  weight: number;
}
export interface ClusterPick {
  ids: string[];
  stationId: string | null;
  lat: number;
  lng: number;
}
export type Bounds4 = [number, number, number, number]; // south, west, north, east

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

const SATELLITE = MAPTILER_KEY
  ? {
      url: `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
      attribution: '&copy; MapTiler &copy; OpenStreetMap contributors',
      maxZoom: 20,
      labels: null as string | null,
    }
  : {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
      labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    };

const SOURCES: Record<OnlineBase, { url: string; attribution: string; maxZoom: number; maxNativeZoom: number; labels: boolean }> = {
  satellite: { url: SATELLITE.url, attribution: SATELLITE.attribution, maxZoom: 19, maxNativeZoom: SATELLITE.maxZoom, labels: !!SATELLITE.labels },
  // Sentinel-2 cloudless (EOX) — free, no key, photo-like imagery up to ~zoom 13
  sentinel: {
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: 'Sentinel-2 cloudless — s2maps.eu by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2020)',
    maxZoom: 19,
    maxNativeZoom: 13,
    labels: true,
  },
  // NASA GIBS Blue Marble with sea-floor shading — free, no key, whole-country view up to zoom 8
  nasa: {
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    attribution: 'Imagery: NASA EOSDIS GIBS / Blue Marble',
    maxZoom: 19,
    maxNativeZoom: 8,
    labels: true,
  },
  street: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19, maxNativeZoom: 19, labels: false },
};

const LABEL_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const STREET = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

/* ---------------- built-in Philippines map (works offline) ---------------- */

const LAND = land as unknown as GeoJSON.FeatureCollection;

const landStyle = (f?: GeoJSON.Feature): L.PathOptions =>
  f?.properties?.name === 'Philippines'
    ? { fillColor: '#f7f0d9', fillOpacity: 1, color: '#8a815a', weight: 1.1 }
    : { fillColor: '#ece7d8', fillOpacity: 1, color: '#aaa38a', weight: 0.8 };

const SEA_LABELS: { name: string; lat: number; lng: number; sea?: boolean; minZ?: number; maxZ?: number }[] = [
  { name: 'LUZON', lat: 16.6, lng: 121.0, maxZ: 8 },
  { name: 'Mindoro', lat: 12.95, lng: 121.05, maxZ: 9 },
  { name: 'Palawan', lat: 9.7, lng: 118.7, maxZ: 9 },
  { name: 'Panay', lat: 11.15, lng: 122.45, maxZ: 9 },
  { name: 'Negros', lat: 10.1, lng: 123.0, maxZ: 9 },
  { name: 'Cebu', lat: 10.25, lng: 123.85, maxZ: 9 },
  { name: 'Leyte', lat: 10.9, lng: 124.9, maxZ: 9 },
  { name: 'Samar', lat: 12.0, lng: 125.1, maxZ: 9 },
  { name: 'MINDANAO', lat: 7.9, lng: 125.1, maxZ: 8 },
  { name: 'Batangas', lat: 13.85, lng: 121.05, minZ: 8, maxZ: 11 },
  { name: 'Verde Island Passage', lat: 13.55, lng: 121.0, sea: true, minZ: 9, maxZ: 12 },
  { name: 'South China Sea', lat: 14.2, lng: 116.8, sea: true, maxZ: 8 },
  { name: 'Philippine Sea', lat: 14.0, lng: 128.0, sea: true, maxZ: 8 },
  { name: 'Sulu Sea', lat: 9.3, lng: 120.0, sea: true, maxZ: 8 },
  { name: 'Celebes Sea', lat: 5.2, lng: 123.0, sea: true, maxZ: 8 },
  { name: 'Taiwan', lat: 23.6, lng: 121.0, maxZ: 7 },
  { name: 'Borneo', lat: 4.6, lng: 115.5, maxZ: 7 },
  { name: 'Vietnam', lat: 15.0, lng: 108.6, maxZ: 7 },
];

const labelIcons = new Map<string, L.DivIcon>();
function labelIcon(name: string, sea: boolean) {
  const hit = labelIcons.get(name);
  if (hit) return hit;
  const color = sea ? '#4f7fa6' : '#6f6a55';
  const icon = L.divIcon({
    html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;font:${sea ? 'italic 600' : '700'} ${sea ? 12 : 11}px Inter,system-ui,sans-serif;letter-spacing:${sea ? '.14em' : '.1em'};color:${color};text-shadow:0 0 4px #fff,0 0 4px #fff;pointer-events:none">${name}</div>`,
    className: 'reef-search-pin',
    iconSize: [0, 0],
  });
  labelIcons.set(name, icon);
  return icon;
}

const PlaceLabels: React.FC = () => {
  const map = useMap();
  const [zoom, setZoom] = React.useState(() => Math.round(map.getZoom()));
  useMapEvents({ zoomend: () => setZoom(Math.round(map.getZoom())) });
  return (
    <>
      {SEA_LABELS.filter((l) => zoom >= (l.minZ ?? 0) && zoom <= (l.maxZ ?? 99)).map((l) => (
        <Marker key={l.name} position={[l.lat, l.lng]} icon={labelIcon(l.name, !!l.sea)} interactive={false} keyboard={false} />
      ))}
    </>
  );
};

/** Online tiles with a safety net: if none load (offline / blocked), ask the parent to fall back. */
const Tiles: React.FC<{ basemap: OnlineBase; onFail: (b: Basemap) => void }> = ({ basemap, onFail }) => {
  const stats = useRef({ ok: 0, err: 0, fired: false });
  const failRef = useRef(onFail);
  useEffect(() => {
    failRef.current = onFail;
  });
  const fire = useCallback(() => {
    if (!stats.current.fired && stats.current.ok === 0) {
      stats.current.fired = true;
      failRef.current(basemap);
    }
  }, [basemap]);
  useEffect(() => {
    const t = setTimeout(fire, 9000); // black-holed requests never error, so also give up after a while
    return () => clearTimeout(t);
  }, [fire]);
  const handlers = useMemo(
    () => ({
      tileload: () => {
        stats.current.ok++;
      },
      tileerror: () => {
        stats.current.err++;
        if (stats.current.err >= 4) fire();
      },
    }),
    [fire]
  );
  const cfg = SOURCES[basemap];
  return (
    <>
      <TileLayer url={cfg.url} attribution={cfg.attribution} maxZoom={cfg.maxZoom} maxNativeZoom={cfg.maxNativeZoom} eventHandlers={handlers} />
      {cfg.labels && <TileLayer url={LABEL_TILES} maxZoom={19} opacity={0.9} />}
    </>
  );
};

/* ---------------- heatmap ---------------- */

const HeatLayer: React.FC<{ points: HeatPoint[]; visible: boolean; intensity: number; heatScale: number }> = ({
  points,
  visible,
  intensity,
  heatScale,
}) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const pane = map.getPane('reefHeat') ?? map.createPane('reefHeat');
    pane.style.zIndex = '250';
    pane.style.pointerEvents = 'none';
    const canvas = L.DomUtil.create('canvas', '', pane) as HTMLCanvasElement;
    canvas.style.position = 'absolute';
    canvas.style.transition = 'opacity .25s';
    canvasRef.current = canvas;
    return () => {
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size.x, size.y);
    if (!visible || points.length === 0) return;

    // Density grid at 1/4 resolution: each image adds a gaussian blob; colour is the
    // weighted average of the nearby images' class colours, opacity follows density.
    const scale = 0.33;
    const gw = Math.ceil(size.x * scale) + 1;
    const gh = Math.ceil(size.y * scale) + 1;
    const Wt = new Float32Array(gw * gh);
    const R = new Float32Array(gw * gh);
    const G = new Float32Array(gw * gh);
    const B = new Float32Array(gw * gh);

    const center = map.getCenter();
    const mpp = (156543.03392 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, map.getZoom());
    const rpx = Math.min(Math.max((450 / mpp) * heatScale, 44 * heatScale), 140 * heatScale);
    const rg = rpx * scale;
    const sigma2 = (rg / 3) ** 2 * 2; // kernel fades to ~1% at its edge, so no visible disc outline

    for (const p of points) {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      if (pt.x < -rpx || pt.y < -rpx || pt.x > size.x + rpx || pt.y > size.y + rpx) continue;
      const cx = pt.x * scale;
      const cy = pt.y * scale;
      const x0 = Math.max(0, Math.floor(cx - rg));
      const x1 = Math.min(gw - 1, Math.ceil(cx + rg));
      const y0 = Math.max(0, Math.floor(cy - rg));
      const y1 = Math.min(gh - 1, Math.ceil(cy + rg));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d2 = (x - cx) ** 2 + (y - cy) ** 2;
          if (d2 > rg * rg) continue;
          const k = Math.exp(-d2 / sigma2) * p.weight;
          const i = y * gw + x;
          Wt[i] += k;
          R[i] += k * p.rgb[0];
          G[i] += k * p.rgb[1];
          B[i] += k * p.rgb[2];
        }
      }
    }

    const off = document.createElement('canvas');
    off.width = gw;
    off.height = gh;
    const octx = off.getContext('2d')!;
    const img = octx.createImageData(gw, gh);
    const gain = 0.55;
    const k = (intensity / 100) * 0.88;
    for (let i = 0; i < Wt.length; i++) {
      const w = Wt[i];
      if (w < 0.0005) continue;
      img.data[i * 4] = R[i] / w;
      img.data[i * 4 + 1] = G[i] / w;
      img.data[i * 4 + 2] = B[i] / w;
      img.data[i * 4 + 3] = 255 * (1 - Math.exp(-w * gain)) * k;
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, gw, gh, 0, 0, size.x, size.y);
  }, [map, points, visible, intensity, heatScale]);

  const schedule = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, [draw]);

  useMapEvents({
    move: schedule,
    moveend: schedule,
    resize: schedule,
    zoomstart: () => {
      if (canvasRef.current) canvasRef.current.style.opacity = '0';
    },
    zoomend: () => {
      draw();
      if (canvasRef.current) canvasRef.current.style.opacity = '1';
    },
  });

  useEffect(() => {
    draw();
  }, [draw]);

  return null;
};

/* ---------------- photo clusters (iPhone-Photos style) ---------------- */

type LeafProps = { id: string; sid: string; t: string };
type ClusterProps = { sid: string; mixed: boolean; keyId: string; keyT: string };

const iconCache = new Map<string, L.DivIcon>();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function clusterIcon(thumb: string, count: number, label: string | null) {
  const key = `c|${thumb.length}|${thumb.slice(-24)}|${count}|${label}`;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const size = count > 99 ? 66 : count > 20 ? 60 : 54;
  const ring = 'border:3px solid #fff;box-shadow:0 8px 18px -6px rgba(0,0,0,.65);border-radius:999px;';
  const stem = 12;
  const dot = 10;
  const html = `
    <div style="position:relative;width:${size}px;height:${size + stem + dot}px;cursor:pointer">
      <div style="position:absolute;left:0;top:0;width:${size}px;height:${size}px">
        <div style="position:absolute;inset:0;transform:translate(9px,-6px) rotate(10deg);background:rgba(255,255,255,.6);${ring}"></div>
        <div style="position:absolute;inset:0;transform:translate(-8px,-3px) rotate(-8deg);background:rgba(255,255,255,.85);${ring}"></div>
        <div style="position:absolute;inset:0;background:#2b3140 url('${thumb.replace(/'/g, '%27')}') center/cover;${ring}"></div>
        <div style="position:absolute;top:-8px;right:-12px;min-width:26px;height:26px;padding:0 8px;border-radius:999px;background:linear-gradient(135deg,#4a44b5,#3b6fe0);color:#fff;font:700 12px Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 4px 10px -2px rgba(0,0,0,.5)">${count > 999 ? Math.round(count / 100) / 10 + 'k' : count}</div>
      </div>
      <span style="position:absolute;left:50%;top:${size}px;width:3px;height:${stem}px;transform:translateX(-50%);background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.45);border-radius:2px"></span>
      <span style="position:absolute;left:50%;top:${size + stem}px;width:${dot}px;height:${dot}px;transform:translateX(-50%);background:#3b6fe0;border:2px solid #fff;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.55);box-sizing:border-box"></span>
      ${label ? `<span style="position:absolute;left:calc(50% + 14px);top:${size + stem + dot / 2}px;transform:translateY(-50%);font:700 11px Inter,system-ui,sans-serif;color:#1f2430;background:rgba(255,255,255,.94);padding:3px 10px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 10px -4px rgba(0,0,0,.5)">${esc(label)}</span>` : ''}
    </div>`;
  const icon = L.divIcon({ html, className: 'reef-pin', iconSize: [size, size + stem + dot], iconAnchor: [size / 2, size + stem + dot / 2] });
  iconCache.set(key, icon);
  return icon;
}

function photoIcon(thumb: string, color: string, selected: boolean) {
  const key = `p|${thumb.length}|${thumb.slice(-24)}|${color}|${selected}`;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const size = selected ? 56 : 44;
  const stem = 8;
  const dot = 8;
  const html = `
    <div style="position:relative;width:${size}px;height:${size + stem + dot}px;cursor:pointer">
      ${selected ? `<span style="position:absolute;left:-6px;top:-6px;width:${size + 12}px;height:${size + 12}px;border-radius:999px;background:${color};opacity:.45;animation:reef-pulse 1.6s ease-out infinite"></span>` : ''}
      <div style="position:absolute;left:0;top:0;width:${size}px;height:${size}px;background:#2b3140 url('${thumb.replace(/'/g, '%27')}') center/cover;border-radius:999px;border:3px solid #fff;box-shadow:0 0 0 3px ${color}, 0 8px 18px -6px rgba(0,0,0,.7);box-sizing:border-box"></div>
      <span style="position:absolute;left:50%;top:${size}px;width:3px;height:${stem}px;transform:translateX(-50%);background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.45);border-radius:2px"></span>
      <span style="position:absolute;left:50%;top:${size + stem}px;width:${dot}px;height:${dot}px;transform:translateX(-50%);background:${color};border:2px solid #fff;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.55);box-sizing:border-box"></span>
    </div>`;
  const icon = L.divIcon({ html, className: 'reef-pin', iconSize: [size, size + stem + dot], iconAnchor: [size / 2, size + stem + dot / 2] });
  iconCache.set(key, icon);
  return icon;
}

const ClusterLayer: React.FC<{
  images: ReefImage[];
  stationNames: Record<string, string>;
  selectedImageId: string | null;
  onPhotoClick: (id: string) => void;
  onClusterClick: (c: ClusterPick) => void;
}> = ({ images, stationNames, selectedImageId, onPhotoClick, onClusterClick }) => {
  const map = useMap();
  const [view, setView] = React.useState<{ bbox: [number, number, number, number]; zoom: number } | null>(null);

  const byId = useMemo(() => new Map(images.map((i) => [i.id, i])), [images]);

  const index = useMemo(() => {
    const sc = new Supercluster<LeafProps, ClusterProps>({
      radius: 62,
      maxZoom: 17,
      minPoints: 2,
      map: (p) => ({ sid: p.sid, mixed: false, keyId: p.id, keyT: p.t }),
      reduce: (acc, p) => {
        if (acc.sid !== p.sid) acc.mixed = true;
        if (p.keyT > acc.keyT) {
          acc.keyT = p.keyT;
          acc.keyId = p.keyId;
        }
      },
    });
    sc.load(
      images.map((i) => ({
        type: 'Feature' as const,
        properties: { id: i.id, sid: i.stationId ?? '_', t: i.capturedAt },
        geometry: { type: 'Point' as const, coordinates: [i.lng, i.lat] as [number, number] },
      }))
    );
    return sc;
  }, [images]);

  const refresh = React.useCallback(() => {
    const b = map.getBounds().pad(0.25);
    setView({ bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom: Math.round(map.getZoom()) });
  }, [map]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useMapEvents({ moveend: refresh, zoomend: refresh });

  const features = useMemo(() => (view ? index.getClusters(view.bbox, view.zoom) : []), [index, view]);

  return (
    <>
      {features.map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const props = f.properties as ClusterProperties & ClusterProps & Partial<LeafProps>;
        if (props.cluster) {
          const key = byId.get(props.keyId);
          const thumb = key ? getThumbSrc(key) : '';
          const label = !props.mixed && props.sid !== '_' ? stationNames[props.sid] ?? null : null;
          return (
            <Marker
              key={`c${props.cluster_id}`}
              position={[lat, lng]}
              icon={clusterIcon(thumb, props.point_count, label)}
              zIndexOffset={300}
              eventHandlers={{
                click: () => {
                  const leaves = index.getLeaves(props.cluster_id, Infinity);
                  const ids = leaves.map((l) => l.properties.id);
                  const target = Math.min(18, Math.max(index.getClusterExpansionZoom(props.cluster_id), map.getZoom() + 1));
                  map.flyTo([lat, lng], target, { duration: 0.9 });
                  onClusterClick({ ids, stationId: props.mixed ? null : props.sid === '_' ? null : props.sid, lat, lng });
                },
              }}
            />
          );
        }
        const img = byId.get(props.id as string);
        if (!img) return null;
        const selected = img.id === selectedImageId;
        return (
          <Marker
            key={`p${img.id}`}
            position={[lat, lng]}
            icon={photoIcon(getThumbSrc(img), CLASS_META[dominantOf(img)].color, selected)}
            zIndexOffset={selected ? 1000 : 500}
            eventHandlers={{ click: () => onPhotoClick(img.id) }}
          />
        );
      })}
    </>
  );
};

const searchIcon = L.divIcon({
  html: '<div style="position:relative;width:22px;height:22px"><span style="position:absolute;inset:0;border-radius:999px;background:#3b6fe0;opacity:.35;animation:reef-pulse 1.5s ease-out infinite"></span><span style="position:absolute;inset:5px;border-radius:999px;background:#3b6fe0;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span></div>',
  className: 'reef-search-pin',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/* ---------------- bridge ---------------- */

const Bridge: React.FC<{
  onReady: (m: L.Map) => void;
  onBounds: (b: Bounds4) => void;
  onCursor: (lat: number, lng: number) => void;
  active: boolean;
}> = ({ onReady, onBounds, onCursor, active }) => {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    const b = map.getBounds();
    onBounds([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => map.invalidateSize(), 60);
      return () => clearTimeout(t);
    }
  }, [active, map]);
  useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onBounds([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]);
    },
    mousemove: (e) => onCursor(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

export interface ReefMapViewProps {
  images: ReefImage[];
  stationNames: Record<string, string>;
  heatPoints: HeatPoint[];
  heatOn: boolean;
  heatIntensity: number;
  heatSize: number;
  basemap: Basemap;
  selectedImageId: string | null;
  searchMarker: { lat: number; lng: number } | null;
  initialBounds: [[number, number], [number, number]];
  active: boolean;
  onPhotoClick: (id: string) => void;
  onClusterClick: (c: ClusterPick) => void;
  onBoundsChange: (b: Bounds4) => void;
  onCursor: (lat: number, lng: number) => void;
  onMapReady: (m: L.Map) => void;
  onTilesFailed: (b: Basemap) => void;
}

const ReefMapView: React.FC<ReefMapViewProps> = ({
  images,
  stationNames,
  heatPoints,
  heatOn,
  heatIntensity,
  heatSize,
  basemap,
  selectedImageId,
  searchMarker,
  initialBounds,
  active,
  onPhotoClick,
  onClusterClick,
  onBoundsChange,
  onCursor,
  onMapReady,
  onTilesFailed,
}) => {
  const bounds = useMemo(() => L.latLngBounds(initialBounds).pad(0.15), [initialBounds]);

  return (
    <MapContainer
      bounds={bounds}
      zoomControl={false}
      minZoom={5}
      maxZoom={19}
      className="absolute inset-0 h-full w-full"
      style={{ background: '#a9d3ea' }}
    >
      {/* the built-in map sits under the online tiles, so something is always on screen */}
      <Pane name="builtinLand" style={{ zIndex: 150 }}>
        <GeoJSON data={LAND} style={landStyle} interactive={false} />
      </Pane>
      {basemap !== 'outline' && <Tiles key={basemap} basemap={basemap} onFail={onTilesFailed} />}
      {basemap === 'outline' && <PlaceLabels />}

      <Bridge onReady={onMapReady} onBounds={onBoundsChange} onCursor={onCursor} active={active} />
      <HeatLayer points={heatPoints} visible={heatOn} intensity={heatIntensity} heatScale={heatSize} />
      <ClusterLayer images={images} stationNames={stationNames} selectedImageId={selectedImageId} onPhotoClick={onPhotoClick} onClusterClick={onClusterClick} />

      {searchMarker && <Marker position={[searchMarker.lat, searchMarker.lng]} icon={searchIcon} interactive={false} />}
    </MapContainer>
  );
};

export default ReefMapView;
