'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type L from 'leaflet';
import { ChevronLeft, ChevronRight, Download, Globe2, Images, Layers as LayersIcon, Lightbulb, Locate, MapPin, Maximize2, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { CLASS_META, CLASS_ORDER, CoralClass, Layers, ReefImage, ReefStation } from '../lib/types';
import { coverOf, dominantOf } from '../lib/reefMath';
import { getImageSrc } from '../lib/imageArt';
import { formatCaptured, formatCoords, PH_BOUNDS } from '../lib/geo';
import { exportImagesCsv } from '../lib/exportCsv';
import { CoverBar, GhostButton, StatusBadge, Switch } from './ui';
import { PhotoDetailPanel } from './PhotoDetailPanel';
import type { Basemap, Bounds4, ClusterPick, HeatPoint } from './ReefMapView';

const ReefMapView = dynamic(() => import('./ReefMapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1b3a4b] text-sm text-white/70">Loading map…</div>
  ),
});

const PAGE_SIZE = 12;
const BASEMAPS: { id: Basemap; name: string; hint: string }[] = [
  { id: 'satellite', name: 'Satellite (Esri)', hint: 'Detailed photo imagery' },
  { id: 'sentinel', name: 'Satellite (Sentinel-2)', hint: 'Free ESA imagery, no key' },
  { id: 'nasa', name: 'Satellite (NASA)', hint: 'Country-scale Blue Marble' },
  { id: 'street', name: 'Street map', hint: 'OpenStreetMap' },
  { id: 'outline', name: 'Built-in outline', hint: 'Works offline' },
];
const BASEMAP_NAMES = Object.fromEntries(BASEMAPS.map((b) => [b.id, b.name])) as Record<Basemap, string>;
// when a source can't load we try the next one down
const FALLBACK: Partial<Record<Basemap, Basemap>> = { satellite: 'sentinel', sentinel: 'nasa', nasa: 'street', street: 'outline' };

type Enriched = { img: ReefImage; cover: Record<CoralClass, number>; dom: CoralClass };

/* ---------- search box ---------- */

interface PlaceHit {
  label: string;
  lat: number;
  lng: number;
}

const SearchBox: React.FC<{
  stations: ReefStation[];
  onPickStation: (id: string) => void;
  onPickPlace: (p: PlaceHit) => void;
}> = ({ stations, onPickStation, onPickPlace }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [busy, setBusy] = useState(false);

  const stationHits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return stations.filter((st) => `${st.name} ${st.area}`.toLowerCase().includes(s)).slice(0, 4);
  }, [q, stations]);

  const coordHit = useMemo<PlaceHit | null>(() => {
    const m = q.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/);
    if (!m) return null;
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { label: `Go to ${lat}, ${lng}`, lat, lng } : null;
  }, [q]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 3 || coordHit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaces([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ph&q=${encodeURIComponent(term)}`,
          { signal: ctrl.signal, headers: { Accept: 'application/json' } }
        );
        const json = (await res.json()) as { display_name: string; lat: string; lon: string }[];
        setPlaces(json.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })));
      } catch {
        /* offline or aborted — station matches still work */
      } finally {
        setBusy(false);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, coordHit]);

  const showList = open && q.trim().length > 0;
  const nothing = !stationHits.length && !places.length && !coordHit;

  return (
    <div className="relative w-[min(340px,calc(100vw-110px))]">
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)] focus-within:ring-2 focus-within:ring-[#3b6fe0]">
        <Search size={16} className="shrink-0 text-[#6b7280]" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search Location"
          aria-label="Search location"
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#1f2430] outline-none placeholder:text-[#8a8f9c]"
        />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="cursor-pointer text-[#6b7280] hover:text-black">
            <X size={15} />
          </button>
        )}
      </div>
      {showList && (
        <ul className="absolute left-0 right-0 top-full z-[1200] mt-2 max-h-72 overflow-auto rounded-3xl bg-white p-1.5 text-[13px] shadow-[0_6px_20px_rgba(0,0,0,.3)]">
          {coordHit && (
            <li>
              <button type="button" onMouseDown={() => onPickPlace(coordHit)} className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-left hover:bg-[#eef2ff]">
                <Locate size={14} className="text-[#3b6fe0]" /> {coordHit.label}
              </button>
            </li>
          )}
          {stationHits.map((s) => (
            <li key={s.id}>
              <button type="button" onMouseDown={() => onPickStation(s.id)} className="flex w-full cursor-pointer items-start gap-2 px-3.5 py-2 text-left hover:bg-[#eef2ff]">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#e53935]" />
                <span>
                  <span className="block font-semibold text-[#1f2430]">{s.name}</span>
                  <span className="block text-[12px] text-[#6b7280]">Survey station · {s.area}</span>
                </span>
              </button>
            </li>
          ))}
          {places.map((p, i) => (
            <li key={i}>
              <button type="button" onMouseDown={() => onPickPlace(p)} className="flex w-full cursor-pointer items-start gap-2 px-3.5 py-2 text-left hover:bg-[#eef2ff]">
                <Search size={14} className="mt-0.5 shrink-0 text-[#6b7280]" />
                <span className="line-clamp-2">{p.label}</span>
              </button>
            </li>
          ))}
          {busy && <li className="px-3.5 py-2 text-[12px] text-[#6b7280]">Searching places…</li>}
          {!busy && nothing && <li className="px-3.5 py-2 text-[12px] text-[#6b7280]">No matches. Try a place name or “lat, lng”.</li>}
        </ul>
      )}
    </div>
  );
};

/* ---------- compact stat (floating bar) ---------- */

const MiniStat: React.FC<{ value: string; label: string; dot?: string }> = ({ value, label, dot }) => (
  <div className="px-3.5 leading-tight">
    <div className="font-display flex items-center gap-1.5 text-[19px] font-semibold text-[#1f2430]">
      {dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />}
      {value}
    </div>
    <div className="text-[10.5px] font-semibold text-[#6b7280]">{label}</div>
  </div>
);

/* ---------- pagination ---------- */

function pageList(total: number, cur: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

const Pagination: React.FC<{ page: number; total: number; onChange: (p: number) => void }> = ({ page, total, onChange }) => (
  <nav className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[12.5px] font-semibold text-[#2d3340]" aria-label="Pagination">
    <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="flex cursor-pointer items-center gap-0.5 rounded-full px-3 py-1.5 hover:bg-[#eef2ff] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent">
      <ChevronLeft size={14} /> Back
    </button>
    {pageList(total, page).map((p, i) =>
      p === '…' ? (
        <span key={`e${i}`} className="px-1 opacity-50">…</span>
      ) : (
        <button
          key={p}
          type="button"
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
          className={`h-8 min-w-8 cursor-pointer rounded-full px-2 ${p === page ? 'bg-gradient-to-br from-[#4a44b5] to-[#3b6fe0] text-white shadow-[0_6px_14px_-6px_rgba(59,70,200,.8)]' : 'bg-white ring-1 ring-[#dfe4f8] hover:bg-[#eef2ff]'}`}
        >
          {p}
        </button>
      )
    )}
    <button type="button" disabled={page >= total} onClick={() => onChange(page + 1)} className="flex cursor-pointer items-center gap-0.5 rounded-full px-3 py-1.5 hover:bg-[#eef2ff] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent">
      Next <ChevronRight size={14} />
    </button>
  </nav>
);

/* ---------- screen ---------- */

interface Props {
  images: ReefImage[];
  stations: ReefStation[];
  active: boolean;
  onOpenImage: (id: string, orderedIds: string[]) => void;
  focusRequest: { lat: number; lng: number; stationId: string | null; imageId: string; nonce: number } | null;
  onUpdateImage: (img: ReefImage) => void;
}

export const MapScreen: React.FC<Props> = ({ images, stations, active, onOpenImage, focusRequest, onUpdateImage }) => {
  const mapRef = useRef<L.Map | null>(null);
  const [layers, setLayers] = useState<Layers>({ lc: true, pb: true, dc: true, dca: true });
  const [heatOn, setHeatOn] = useState(true);
  const [heatIntensity, setHeatIntensity] = useState(80);
  const [heatSize, setHeatSize] = useState(1);
  const [basemap, setBasemap] = useState<Basemap>('satellite');
  // what the side panel is showing: a cluster/station scope (or null = "whatever is in the map view") and, optionally, one photo
  const [scope, setScope] = useState<{ ids: string[]; stationId: string | null; label: string } | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const selectedId = scope?.stationId ?? null;
  const [follow, setFollow] = useState(true);
  const [status, setStatus] = useState<'all' | 'verified' | 'pending'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'bleached'>('newest');
  const [page, setPage] = useState(1);
  const [bounds, setBounds] = useState<Bounds4 | null>(null);
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [mapNote, setMapNote] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem('map-tip-dismissed')) setTipOpen(true);
    } catch {
      /* storage blocked */
    }
  }, []);
  useEffect(() => {
    if (!active || !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== 'Escape' || (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return;
      if (photoId) setPhotoId(null);
      else setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, drawerOpen, photoId]);

  useEffect(() => {
    if (!mapNote) return;
    const t = setTimeout(() => setMapNote(null), 12000);
    return () => clearTimeout(t);
  }, [mapNote]);

  const [basemapMenu, setBasemapMenu] = useState(false);

  const handleTilesFailed = (failed: Basemap) => {
    const next = FALLBACK[failed] ?? 'outline';
    setBasemap(next);
    setMapNote(`${BASEMAP_NAMES[failed]} couldn’t load on this connection, so I switched to ${BASEMAP_NAMES[next]}. You can pick another map with the layers button.`);
  };

  const dismissTip = () => {
    setTipOpen(false);
    try {
      localStorage.setItem('map-tip-dismissed', '1');
    } catch {
      /* ignore */
    }
  };

  const enriched = useMemo<Enriched[]>(
    () => images.map((img) => ({ img, cover: coverOf(img.patches), dom: dominantOf(img) })),
    [images]
  );

  const eligible = useMemo(() => enriched.filter((e) => status === 'all' || e.img.status === status), [enriched, status]);
  const shown = useMemo(() => eligible.filter((e) => layers[e.dom]), [eligible, layers]);

  const heatPoints = useMemo<HeatPoint[]>(() => {
    // colour = where the enabled cover sits on the legend ramp (LC green → PB yellow → DC orange → DCA red)
    const pts: HeatPoint[] = [];
    for (const e of eligible) {
      let total = 0;
      let score = 0;
      CLASS_ORDER.forEach((k, idx) => {
        if (!layers[k]) return;
        total += e.cover[k];
        score += e.cover[k] * idx;
      });
      if (total <= 0) continue;
      const pos = Math.min(CLASS_ORDER.length - 1, Math.max(0, score / total));
      const i = Math.min(CLASS_ORDER.length - 2, Math.floor(pos));
      const t = pos - i;
      const a = CLASS_META[CLASS_ORDER[i]].rgb;
      const b = CLASS_META[CLASS_ORDER[i + 1]].rgb;
      pts.push({
        lat: e.img.lat,
        lng: e.img.lng,
        rgb: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
        weight: total / 100,
      });
    }
    return pts;
  }, [eligible, layers]);

  const pins = useMemo<{ id: string; name: string; lat: number; lng: number; count: number }[]>(() => {
    const counts = new Map<string, number>();
    for (const e of shown) if (e.img.stationId) counts.set(e.img.stationId, (counts.get(e.img.stationId) ?? 0) + 1);
    return stations.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, count: counts.get(s.id) ?? 0 }));
  }, [shown, stations]);

  const selectedStation = selectedId ? stations.find((s) => s.id === selectedId) ?? null : null;

  const scoped = useMemo(() => {
    let list = shown;
    if (scope) {
      const keep = new Set(scope.ids);
      list = list.filter((e) => keep.has(e.img.id));
    } else if (follow && bounds) {
      const [s, w, n, ea] = bounds;
      list = list.filter((e) => e.img.lat >= s && e.img.lat <= n && e.img.lng >= w && e.img.lng <= ea);
    }
    const sorted = [...list];
    if (sort === 'newest') sorted.sort((a, b) => b.img.capturedAt.localeCompare(a.img.capturedAt));
    else if (sort === 'oldest') sorted.sort((a, b) => a.img.capturedAt.localeCompare(b.img.capturedAt));
    else sorted.sort((a, b) => a.cover.lc - b.cover.lc); // least living coral first
    return sorted;
  }, [shown, scope, follow, bounds, sort]);

  const stats = useMemo(() => {
    const n = scoped.length || 1;
    const lc = scoped.reduce((t, e) => t + e.cover.lc, 0) / n;
    const bleached = scoped.reduce((t, e) => t + e.cover.pb + e.cover.dc + e.cover.dca, 0) / n;
    return {
      count: scoped.length,
      lc,
      bleached,
      pending: scoped.filter((e) => e.img.status === 'pending').length,
      stations: new Set(scoped.map((e) => e.img.stationId ?? e.img.location)).size,
    };
  }, [scoped]);

  const totalPages = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const pageItems = scoped.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const stationCover = useMemo(() => {
    if (!selectedId) return null;
    const list = enriched.filter((e) => e.img.stationId === selectedId);
    const sum: Record<CoralClass, number> = { lc: 0, pb: 0, dc: 0, dca: 0 };
    for (const e of list) for (const k of CLASS_ORDER) sum[k] += e.cover[k] / (list.length || 1);
    return { cover: sum, count: list.length, pending: list.filter((e) => e.img.status === 'pending').length };
  }, [enriched, selectedId]);

  /* ---- map actions ---- */
  const flyTo = (lat: number, lng: number, zoom: number) => mapRef.current?.flyTo([lat, lng], zoom, { duration: 1.1 });

  const photoImage = photoId ? images.find((i) => i.id === photoId) ?? null : null;
  const photoIndex = photoId ? scoped.findIndex((e) => e.img.id === photoId) : -1;

  const stationNames = useMemo(() => Object.fromEntries(stations.map((st) => [st.id, st.name])), [stations]);
  const shownImages = useMemo(() => shown.map((e) => e.img), [shown]);

  const clearScope = () => {
    setScope(null);
    setPhotoId(null);
    setPage(1);
  };

  const selectStation = (id: string) => {
    const ids = shownImages.filter((i) => i.stationId === id).map((i) => i.id);
    setScope({ ids, stationId: id, label: stationNames[id] ?? 'Station' });
    setPhotoId(null);
    setPage(1);
    setDrawerOpen(true);
    const pts = shownImages.filter((i) => i.stationId === id).map((i) => [i.lat, i.lng] as [number, number]);
    if (pts.length > 1) mapRef.current?.flyToBounds(pts, { padding: [120, 120], maxZoom: 17, duration: 1 });
    else {
      const s0 = stations.find((x) => x.id === id);
      if (s0) flyTo(s0.lat, s0.lng, 16);
    }
  };

  const pickCluster = (c: ClusterPick) => {
    setScope({
      ids: c.ids,
      stationId: c.stationId,
      label: c.stationId ? stationNames[c.stationId] ?? 'Station' : `${c.ids.length} photos in this area`,
    });
    setPhotoId(null);
    setPage(1);
    setDrawerOpen(true);
  };

  const pickPhoto = (id: string, fly = true) => {
    const img = images.find((i) => i.id === id);
    setPhotoId(id);
    setDrawerOpen(true);
    if (img && fly) mapRef.current?.flyTo([img.lat, img.lng], Math.max(mapRef.current.getZoom(), 18), { duration: 0.8 });
  };

  const fitData = () => {
    clearScope();
    const pts = images.map((i) => [i.lat, i.lng] as [number, number]);
    if (pts.length) mapRef.current?.flyToBounds(pts, { padding: [50, 50], maxZoom: 15, duration: 1 });
  };
  const showPhilippines = () => {
    clearScope();
    mapRef.current?.flyToBounds(PH_BOUNDS, { duration: 1 });
  };

  // jump from "View on map" in the details screen
  const lastNonce = useRef(0);
  useEffect(() => {
    if (!focusRequest || focusRequest.nonce === lastNonce.current || !mapReady) return;
    lastNonce.current = focusRequest.nonce;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const sid = focusRequest.stationId;
    setScope(sid ? { ids: images.filter((i) => i.stationId === sid).map((i) => i.id), stationId: sid, label: stationNames[sid] ?? 'Station' } : null);
    setPhotoId(focusRequest.imageId);
    setPage(1);
    setDrawerOpen(true);
    mapRef.current?.flyTo([focusRequest.lat, focusRequest.lng], 18, { duration: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest, mapReady]);

  const toggleLayer = (k: CoralClass, v: boolean) => {
    setLayers((l) => ({ ...l, [k]: v }));
    setPage(1);
  };

  const center = bounds ? { lat: (bounds[0] + bounds[2]) / 2, lng: (bounds[1] + bounds[3]) / 2 } : null;
  const readout = cursor ?? center;

  const initialBounds = useMemo<[[number, number], [number, number]]>(() => {
    const lats = images.map((i) => i.lat);
    const lngs = images.map((i) => i.lng);
    if (!lats.length) return PH_BOUNDS;
    return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextLabel = scope
    ? scope.stationId ? `at ${scope.label}` : 'in the area you picked'
    : follow && bounds
    ? 'in the current map view'
    : 'across all locations';

  const openCls = 'transition-[right] duration-300 right-3 md:data-[open=true]:right-[500px]';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1b3a4b]">
      {/* ---------- full-viewport map ---------- */}
      <div className="absolute inset-0" style={{ isolation: 'isolate' }}>
        <ReefMapView
          images={shownImages}
          stationNames={stationNames}
          heatPoints={heatPoints}
          heatOn={heatOn}
          heatIntensity={heatIntensity}
          heatSize={heatSize}
          basemap={basemap}
          selectedImageId={photoId}
          searchMarker={searchMarker}
          initialBounds={initialBounds}
          active={active}
          onPhotoClick={(id) => pickPhoto(id)}
          onClusterClick={pickCluster}
          onTilesFailed={handleTilesFailed}
          onBoundsChange={(b) => {
            setBounds(b);
            setPage(1);
          }}
          onCursor={(lat, lng) => setCursor({ lat, lng })}
          onMapReady={(m) => {
            mapRef.current = m;
            setMapReady(true);
          }}
        />
      </div>

      {/* ---------- floating controls ---------- */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {/* top-left: (hamburger lives in the shell) brand + search */}
        <div className="pointer-events-auto absolute left-[76px] top-4 flex items-center gap-3">
          <div className="hidden items-center gap-2.5 rounded-full bg-white/95 py-2.5 pl-3.5 pr-5 shadow-[0_10px_22px_-8px_rgba(0,0,0,.55)] backdrop-blur xl:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#4a44b5] to-[#3b6fe0]" />
            <span className="font-display text-[15px] font-semibold text-[#1f2430]">Coral Reef Bleaching Classifier</span>
          </div>
          <SearchBox
            stations={stations}
            onPickStation={(id) => {
              setSearchMarker(null);
              selectStation(id);
            }}
            onPickPlace={(p) => {
              setSearchMarker({ lat: p.lat, lng: p.lng });
              clearScope();
              flyTo(p.lat, p.lng, 13);
            }}
          />
        </div>

        {/* layer chips (as in the proposal: four switches) */}
        <div className="pointer-events-none absolute left-4 right-4 top-[76px] flex flex-wrap gap-2 md:right-24">
          {CLASS_ORDER.map((k) => (
            <label
              key={k}
              className={`pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-white/95 py-1.5 pl-2.5 pr-1.5 text-[11.5px] font-bold text-[#1f2430] shadow-[0_8px_18px_-8px_rgba(0,0,0,.55)] backdrop-blur transition ${layers[k] ? '' : 'opacity-70'}`}
            >
              <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: CLASS_META[k].color }} aria-hidden="true" />
              {CLASS_META[k].label}
              <Switch checked={layers[k]} onChange={(v) => toggleLayer(k, v)} label={`Show ${CLASS_META[k].label}`} />
            </label>
          ))}
          <label className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-white/95 py-1.5 pl-3 pr-1.5 text-[11.5px] font-bold text-[#1f2430] shadow-[0_8px_18px_-8px_rgba(0,0,0,.55)] backdrop-blur">
            Heatmap
            <Switch checked={heatOn} onChange={setHeatOn} label="Show heatmap" />
          </label>
        </div>

        {mapNote && (
          <div role="status" className="reef-rise pointer-events-auto absolute left-4 top-[124px] flex max-w-[min(520px,calc(100vw-100px))] items-start gap-2.5 rounded-3xl bg-[#1f2430]/92 py-2.5 pl-4 pr-2 text-[12.5px] leading-snug text-white shadow-[0_14px_30px_-12px_rgba(0,0,0,.7)] backdrop-blur">
            <span className="flex-1">{mapNote}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setMapNote(null)} className="cursor-pointer rounded-full p-1 text-white/70 hover:text-white"><X size={14} /></button>
          </div>
        )}

        {/* zoom stack */}
        <div data-open={drawerOpen} className={`pointer-events-auto absolute top-1/2 flex -translate-y-1/2 flex-col gap-2 ${openCls}`}>
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-[#2d3a8c] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]">
            <Plus size={24} strokeWidth={3} />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-[#2d3a8c] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]">
            <Minus size={24} strokeWidth={3} />
          </button>
          <button type="button" title="Zoom to all images" aria-label="Zoom to all images" onClick={fitData} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#3b6fe0] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]">
            <Maximize2 size={18} />
          </button>
          <button type="button" title="Show the whole Philippines" aria-label="Show the whole Philippines" onClick={showPhilippines} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#3b6fe0] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]">
            <Globe2 size={18} />
          </button>
          <div className="relative">
            <button
              type="button"
              title="Choose map style"
              aria-label={`Map style: ${BASEMAP_NAMES[basemap]}. Click to change`}
              aria-expanded={basemapMenu}
              onClick={() => setBasemapMenu((v) => !v)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#3b6fe0] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]"
            >
              <LayersIcon size={18} />
            </button>
            {basemapMenu && (
              <>
                <div className="fixed inset-0 z-[5]" onClick={() => setBasemapMenu(false)} aria-hidden="true" />
                <div role="menu" aria-label="Map style" className="reef-rise absolute bottom-0 right-14 z-10 w-[270px] rounded-3xl bg-white/97 p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,.65)] backdrop-blur">
                  <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Map style</div>
                  {BASEMAPS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={basemap === b.id}
                      onClick={() => {
                        setBasemap(b.id);
                        setBasemapMenu(false);
                        setMapNote(null);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-full px-3 py-2 text-left transition ${basemap === b.id ? 'bg-[#eef2ff]' : 'hover:bg-[#f4f6fd]'}`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${basemap === b.id ? 'border-[#3b6fe0]' : 'border-[#c4cae0]'}`}>
                        {basemap === b.id && <span className="h-2 w-2 rounded-full bg-[#3b6fe0]" />}
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block text-[12.5px] font-bold text-[#1f2430]">{b.name}</span>
                        <span className="block truncate text-[11px] text-[#6b7280]">{b.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* bottom-left: stats + photos button */}
        <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap items-end gap-3">
          <div className="pointer-events-auto flex items-center divide-x divide-[#e6e9f5] rounded-3xl bg-white/95 py-2 shadow-[0_12px_28px_-10px_rgba(0,0,0,.55)] backdrop-blur" aria-label="Summary of the images in view">
            <MiniStat value={stats.count.toLocaleString()} label={`images · ${stats.stations} location${stats.stations === 1 ? '' : 's'}`} />
            <div className="hidden sm:block"><MiniStat value={`${stats.lc.toFixed(0)}%`} label="living coral" dot={CLASS_META.lc.color} /></div>
            <div className="hidden sm:block"><MiniStat value={`${stats.bleached.toFixed(0)}%`} label="bleached / dead" dot={CLASS_META.dc.color} /></div>
            <div className="hidden md:block"><MiniStat value={stats.pending.toLocaleString()} label="pending review" dot="#f59e42" /></div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-expanded={drawerOpen}
            className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#4a44b5] to-[#3b6fe0] px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_26px_-10px_rgba(59,70,200,.9)] transition hover:brightness-110 active:scale-[.98]"
          >
            <Images size={16} />
            {drawerOpen ? 'Hide photos' : 'View photos'}
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px]">{stats.count.toLocaleString()}</span>
          </button>
        </div>

        {/* tip card */}
        {tipOpen && (
          <div className="reef-rise pointer-events-auto absolute bottom-[88px] left-4 flex max-w-[360px] items-start gap-3 rounded-3xl bg-white/96 px-4 py-3 text-[12.5px] text-[#2d3340] shadow-[0_14px_30px_-12px_rgba(0,0,0,.6)] backdrop-blur">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e6ebff] to-[#d3f1ea] text-[#3f58b0]"><Lightbulb size={16} /></span>
            <p className="flex-1 leading-relaxed">
              <b>Quick tour:</b> tap a photo cluster to zoom in and see its photos · tap a single photo for its details · the glow shows <b>green healthy → red bleached</b> · ☰ opens the menu.
            </p>
            <button type="button" onClick={dismissTip} aria-label="Dismiss tip" className="cursor-pointer rounded-full p-1 text-[#4b5160] hover:bg-[#eef2ff]"><X size={15} /></button>
          </div>
        )}

        {/* bottom-right: coordinates + heat legend */}
        <div data-open={drawerOpen} className={`pointer-events-none absolute bottom-7 flex flex-col items-end gap-2 ${openCls}`}>
          {heatOn && (
            <div className="pointer-events-auto hidden items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-semibold text-[#1f2430] shadow-[0_8px_18px_-8px_rgba(0,0,0,.55)] backdrop-blur sm:flex">
              Healthy
              <span className="h-2.5 w-24 rounded-full" style={{ background: 'linear-gradient(90deg,#3a9d3a,#f5c026,#f26b2d,#e03a3a)' }} />
              Bleached
            </div>
          )}
          {readout && (
            <div className="pointer-events-auto hidden rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold italic text-[#1f2430] shadow-[0_8px_18px_-8px_rgba(0,0,0,.55)] backdrop-blur sm:block">
              Coordinates {formatCoords(readout.lat, readout.lng)}
            </div>
          )}
        </div>
      </div>

      {/* ---------- photos panel (slides in from the right) ---------- */}
      <aside
        aria-label="Photos"
        inert={!drawerOpen}
        className={`absolute inset-y-0 right-0 z-30 flex w-[min(484px,100vw)] flex-col rounded-l-[32px] bg-white/97 shadow-[-24px_0_60px_-24px_rgba(20,26,70,.7)] backdrop-blur transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 className="font-display truncate text-[20px] font-semibold text-[#1f2430]">
              {photoImage ? 'Photo details' : scope ? scope.label : 'Photos'}
            </h2>
            {!photoImage && (
              <p className="text-[12.5px] text-[#4b5160]">
                <b>{scoped.length.toLocaleString()}</b> image{scoped.length === 1 ? '' : 's'} <span className="text-[#6b7280]">{contextLabel}</span>
              </p>
            )}
            {photoImage && <p className="truncate text-[12.5px] text-[#4b5160]">{photoImage.name}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!photoImage && (
              <GhostButton icon={<Download size={14} />} disabled={scoped.length === 0} onClick={() => exportImagesCsv(scoped.map((e) => e.img))}>
                CSV
              </GhostButton>
            )}
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close photos" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#eef1fb] text-[#2d3340] transition hover:bg-[#e0e6f8]">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="reef-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {photoImage ? (
            <PhotoDetailPanel
              key={photoImage.id}
              image={photoImage}
              position={{ index: Math.max(0, photoIndex), total: Math.max(1, scoped.length) }}
              backLabel={scope?.stationId ? scope.label : 'Photos'}
              onBack={() => setPhotoId(null)}
              onPrev={photoIndex > 0 ? () => pickPhoto(scoped[photoIndex - 1].img.id) : null}
              onNext={photoIndex >= 0 && photoIndex < scoped.length - 1 ? () => pickPhoto(scoped[photoIndex + 1].img.id) : null}
              onUpdate={onUpdateImage}
              onCenter={() => flyTo(photoImage.lat, photoImage.lng, 18)}
              onOpenFull={() => onOpenImage(photoImage.id, scoped.map((e) => e.img.id))}
            />
          ) : (
            <>
          {/* jump to a station */}
          <div hidden={!!scope} className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-2 reef-scroll" aria-label="Jump to a station">
            {pins.filter((p) => p.count > 0).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectStation(p.id)}
                aria-pressed={selectedId === p.id}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold ring-1 transition ${selectedId === p.id ? 'bg-[#3b6fe0] text-white ring-transparent' : 'bg-white text-[#2d3340] ring-[#e1e5f5] hover:bg-[#eef2ff]'}`}
              >
                <MapPin size={12} className={selectedId === p.id ? 'text-white' : 'text-[#e53935]'} />
                {p.name}
                <span className={`rounded-full px-1.5 text-[10px] ${selectedId === p.id ? 'bg-white/25' : 'bg-[#eef0fa]'}`}>{p.count}</span>
              </button>
            ))}
          </div>

          {/* when a cluster mixes stations: break it down */}
          {scope && !scope.stationId && (
            <div className="mb-3 rounded-3xl bg-gradient-to-br from-[#f1f4ff] to-[#eaf8f3] p-4 ring-1 ring-[#e3e8f8]">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13px] font-bold text-[#1f2430]">In this area</div>
                <button type="button" onClick={clearScope} className="cursor-pointer rounded-full bg-white px-3 py-1 text-[11.5px] font-semibold text-[#2d3340] shadow-sm ring-1 ring-[#dfe4f8] hover:bg-[#eef2ff]">Clear</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(scoped.reduce<Record<string, number>>((acc, e) => { const k = e.img.stationId ?? '_'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})).map(([sid, n]) => (
                  <button key={sid} type="button" onClick={() => sid !== '_' && setScope({ ids: scope.ids.filter((id) => images.find((i) => i.id === id)?.stationId === sid), stationId: sid, label: stationNames[sid] ?? 'Station' })} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11.5px] font-semibold shadow-sm ring-1 ring-[#dfe4f8] hover:bg-[#eef2ff]">
                    <MapPin size={12} className="text-[#e53935]" /> {sid === '_' ? 'Other locations' : stationNames[sid] ?? sid}
                    <span className="rounded-full bg-[#eef0fa] px-1.5 text-[10px]">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* selected station */}
          {selectedStation && stationCover && (
            <div className="mb-3 rounded-3xl bg-gradient-to-br from-[#f1f4ff] to-[#eaf8f3] p-4 ring-1 ring-[#e3e8f8]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#1f2430]"><MapPin size={15} className="text-[#e53935]" /> {selectedStation.name}</div>
                  <div className="text-[11.5px] text-[#6b7280]">{selectedStation.area}</div>
                  <div className="text-[11px] text-[#8a8f9c]">{formatCoords(selectedStation.lat, selectedStation.lng)}</div>
                </div>
                <button type="button" onClick={clearScope} className="cursor-pointer rounded-full bg-white px-3 py-1 text-[11.5px] font-semibold text-[#2d3340] shadow-sm ring-1 ring-[#dfe4f8] hover:bg-[#eef2ff]">Clear</button>
              </div>
              <div className="mt-3 text-[11px] text-[#4b5160]">Average cover · {stationCover.count} images</div>
              <CoverBar cover={stationCover.cover} />
              <div className="mt-1 text-[11px] text-[#4b5160]">{CLASS_ORDER.map((k) => `${CLASS_META[k].short} ${stationCover.cover[k].toFixed(0)}%`).join(' · ')}</div>
            </div>
          )}

          {/* options */}
          <details className="group mb-4 rounded-3xl bg-[#f6f7fd] px-4 py-2.5 ring-1 ring-[#e6e9f5]">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[12.5px] font-bold text-[#2d3340]">
              <SlidersHorizontal size={14} /> View options
              <ChevronRight size={14} className="ml-auto transition group-open:rotate-90" />
            </summary>
            <div className="mt-3 grid gap-3 pb-1 text-[12.5px] text-[#2d3340]">
              <label className={`flex items-center justify-between gap-3 ${heatOn ? '' : 'opacity-40'}`}>
                Heat intensity
                <input type="range" min={20} max={100} value={heatIntensity} disabled={!heatOn} onChange={(e) => setHeatIntensity(+e.target.value)} className="w-40 accent-[#3b6fe0]" aria-label="Heatmap intensity" />
              </label>
              <label className={`flex items-center justify-between gap-3 ${heatOn ? '' : 'opacity-40'}`}>
                Heat size
                <input type="range" min={0.6} max={2.5} step={0.1} value={heatSize} disabled={!heatOn} onChange={(e) => setHeatSize(+e.target.value)} className="w-40 accent-[#3b6fe0]" aria-label="Heatmap size" />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3" title="Only list images that are inside the visible part of the map">
                List only what’s in the map view
                <Switch checked={follow} onChange={(v) => { setFollow(v); setPage(1); }} label="Gallery follows map view" />
              </label>
              <label className="flex items-center justify-between gap-3">
                Status
                <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className="cursor-pointer rounded-full border border-[#d9def0] bg-white px-3 py-1.5 shadow-sm">
                  <option value="all">All images</option>
                  <option value="verified">Verified only</option>
                  <option value="pending">Pending review</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-3">
                Sort
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="cursor-pointer rounded-full border border-[#d9def0] bg-white px-3 py-1.5 shadow-sm">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="bleached">Most bleached first</option>
                </select>
              </label>
            </div>
          </details>

          {/* grid */}
          {pageItems.length === 0 ? (
            <div className="rounded-3xl bg-[#f6f7fd] py-12 text-center text-[13px] text-[#4b5160]">
              <p className="font-semibold">No images match what you’re looking at.</p>
              <p className="mt-1 text-[#6b7280]">Zoom out, switch a layer back on, or clear the status filter.</p>
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" onClick={showPhilippines} className="cursor-pointer rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold shadow-sm ring-1 ring-[#dfe4f8] hover:bg-[#eef2ff]">Show the Philippines</button>
                <button type="button" onClick={fitData} className="cursor-pointer rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold shadow-sm ring-1 ring-[#dfe4f8] hover:bg-[#eef2ff]">Zoom to all</button>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-2.5">
              {pageItems.map(({ img, dom }) => (
                <li key={img.id}>
                  <button
                    type="button"
                    onClick={() => pickPhoto(img.id)}
                    className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[22px] bg-[#2b3140] shadow-[0_8px_18px_-8px_rgba(0,0,0,.6)] ring-2 ring-white transition duration-200 hover:-translate-y-0.5 hover:ring-[#3b6fe0]"
                    aria-label={`Open ${img.name}`}
                  >
                    <img src={getImageSrc(img)} alt={`Quadrat photo ${img.name}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                    <span className="absolute left-2 top-2 h-3.5 w-3.5 rounded-full shadow ring-2 ring-white/95" style={{ background: CLASS_META[dom].color }} title={CLASS_META[dom].label} />
                    {img.status === 'pending' && <span className="absolute right-1.5 top-1.5 rounded-full bg-[#fff1cf] px-1.5 py-0.5 text-[9px] font-bold text-[#8a6100]">Pending</span>}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left text-[10.5px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="block truncate font-semibold">{img.location}</span>
                      <span className="block truncate text-white/75">{img.transect} · Q{img.quadrat}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {scoped.length > PAGE_SIZE && <Pagination page={curPage} total={totalPages} onChange={setPage} />}
          <p className="mt-4 text-[11px] text-[#8a8f9c]">
            <StatusBadge status="pending" /> photos are waiting for a reviewer to verify their coral classification.
          </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
