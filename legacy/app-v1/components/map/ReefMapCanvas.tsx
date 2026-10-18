import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type L from 'leaflet';
import { StationData, MapFilters } from '../../types';
import type { Basemap } from './ReefLeafletMap';
import { StationHUD } from './StationHUD';
import { LegendLayerPanel } from './LegendLayerPanel';
import { StationSwitcher } from './StationSwitcher';
import { CartographicControls } from './CartographicControls';
import { SlidersHorizontal } from 'lucide-react';

// Leaflet touches `window` on import, so the real map is client-only.
const ReefLeafletMap = dynamic(() => import('./ReefLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-[12.5px] text-[color:var(--color-reef-sand-dim)]">
      Loading map…
    </div>
  ),
});

const DRILL_ZOOM = 14;

interface ReefMapCanvasProps {
  stations: StationData[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  filters: MapFilters;
  onChangeFilters: (newFilters: MapFilters) => void;
  onOpenTriage: () => void;
  onOpenStationDetail: () => void;
  onOpenPastTransects: () => void;
  onOpenFilterDrawer: () => void;
}

type ViewMode = 'clusters' | 'heatmap';
type ClassKey = 'lc' | 'pb' | 'dc' | 'dca';
const CLASS_ORDER: ClassKey[] = ['lc', 'pb', 'dc', 'dca'];

function activeSum(health: StationData['health'], layers: MapFilters['layers']): number {
  return CLASS_ORDER.reduce((s, k) => s + (layers[k] ? health[k] : 0), 0);
}

export const ReefMapCanvas: React.FC<ReefMapCanvasProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  filters,
  onChangeFilters,
  onOpenTriage,
  onOpenStationDetail,
  onOpenPastTransects,
  onOpenFilterDrawer,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [mode, setMode] = useState<ViewMode>('clusters');
  const [basemap, setBasemap] = useState<Basemap>('dark');
  const [drilledStationId, setDrilledStationId] = useState<string | null>(null);
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const activeStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) || null,
    [stations, selectedStationId]
  );

  const fitAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || stations.length === 0) return;
    const pts = stations.map((s) => [s.lat, s.lng] as [number, number]);
    map.flyToBounds(pts, { padding: [90, 90], maxZoom: 9, duration: 1 });
  }, [stations]);

  const zoomToStation = useCallback((station: StationData) => {
    mapRef.current?.flyTo([station.lat, station.lng], DRILL_ZOOM, { duration: 1.4 });
    setDrilledStationId(station.id);
    setShowHint(false);
  }, []);

  const resetView = useCallback(() => {
    setDrilledStationId(null);
    fitAll();
  }, [fitAll]);

  const handleSelectStation = (stationId: string) => {
    onSelectStation(stationId);
    setIsHudOpen(true);
    const station = stations.find((s) => s.id === stationId);
    if (station) {
      if (mode === 'heatmap') setMode('clusters');
      zoomToStation(station);
    }
  };

  const drilledStation = drilledStationId
    ? stations.find((s) => s.id === drilledStationId) || null
    : null;

  // ---------- hint pill: show briefly on first mount ----------
  useEffect(() => {
    const showTimer = setTimeout(() => setShowHint(true), 700);
    const hideTimer = setTimeout(() => setShowHint(false), 5500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ background: 'var(--color-reef-deep)' }}>
      {/* Real-world Leaflet map (isolated so its internal z-indexes can't cover the UI) */}
      <div className="absolute inset-0" style={{ isolation: 'isolate', zIndex: 0 }}>
        <ReefLeafletMap
          stations={stations}
          filters={filters}
          mode={mode}
          basemap={basemap}
          drilledStationId={drilledStationId}
          onSelectStation={handleSelectStation}
          onOpenStationDetail={onOpenStationDetail}
          onMapReady={(map) => {
            mapRef.current = map;
          }}
          onDrillExit={() => setDrilledStationId(null)}
        />
      </div>

      {/* ---------- Topbar ---------- */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center gap-3 pointer-events-none">
        <div className="reef-r-xl flex items-baseline gap-2 bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] px-4 py-2.5 pointer-events-auto select-none whitespace-nowrap">
          <span aria-hidden="true">🪸</span>
          <h1 className="font-reef-display text-[15px] font-semibold text-[color:var(--color-reef-sand)] m-0">
            Reef Health Map
          </h1>
        </div>

        <div className="reef-r-full flex bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] p-1 gap-1 pointer-events-auto">
          {(['clusters', 'heatmap'] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (m === 'heatmap') resetView();
                setMode(m);
              }}
              className={`reef-r-full px-4 py-2 text-[12.5px] capitalize transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-[color:var(--color-reef-sand)] text-[color:var(--color-reef-deep)] font-semibold'
                  : 'text-[color:var(--color-reef-sand-dim)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto">
          <StationSwitcher
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={handleSelectStation}
          />
        </div>

        <button
          type="button"
          onClick={onOpenFilterDrawer}
          title="Depth range & confidence filters"
          className="reef-r-full flex items-center gap-1.5 bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] px-3.5 py-2.5 text-[12.5px] text-[color:var(--color-reef-sand-dim)] hover:text-[color:var(--color-reef-sand)] transition-colors cursor-pointer pointer-events-auto"
        >
          <SlidersHorizontal size={13} />
          Filters
        </button>

        <div className="reef-r-full flex bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] p-1 gap-1 pointer-events-auto">
          {(['dark', 'satellite'] as Basemap[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBasemap(b)}
              className={`reef-r-full px-3 py-1.5 text-[12px] capitalize transition-colors cursor-pointer ${
                basemap === b
                  ? 'bg-[color:var(--color-reef-sand)] text-[color:var(--color-reef-deep)] font-semibold'
                  : 'text-[color:var(--color-reef-sand-dim)]'
              }`}
            >
              {b === 'dark' ? 'Map' : 'Satellite'}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto flex-1 min-w-[220px]">
          <LegendLayerPanel filters={filters} onChangeFilters={onChangeFilters} />
        </div>
      </div>

      {/* Heat legend, shown only in heatmap mode */}
      <div
        className="reef-r-xl absolute right-4 top-[78px] z-[29] bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] px-3.5 py-2.5 text-[11px] text-[color:var(--color-reef-sand-dim)] transition-all duration-200 pointer-events-none"
        style={{
          opacity: mode === 'heatmap' ? 1 : 0,
          transform: mode === 'heatmap' ? 'translateY(0)' : 'translateY(-6px)',
        }}
      >
        Bleaching stress
        <div
          className="w-[140px] h-2 reef-r-full my-[7px]"
          style={{ background: 'linear-gradient(90deg, #4FA37E, #F2BF7D, #E0523D)' }}
        />
        <div className="flex justify-between">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Breadcrumb, shown when drilled into a station */}
      <nav
        className="reef-r-full absolute left-4 top-[78px] z-[29] flex items-center gap-1.5 text-[12.5px] bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] px-3 py-2 transition-all duration-200"
        style={{
          opacity: drilledStation ? 1 : 0,
          transform: drilledStation ? 'translateY(0)' : 'translateY(-6px)',
          pointerEvents: drilledStation ? 'auto' : 'none',
        }}
        aria-hidden={!drilledStation}
      >
        <button
          type="button"
          onClick={resetView}
          className="text-[color:var(--color-reef-sand)] underline decoration-[color:var(--color-reef-line)] underline-offset-[3px] cursor-pointer"
        >
          All stations
        </button>
        <span className="text-[color:var(--color-reef-sand-dim)]">›</span>
        <span className="text-[color:var(--color-reef-accent)] font-semibold">
          {drilledStation?.name}
        </span>
      </nav>

      {/* Hint pill */}
      <div
        className="reef-r-full absolute bottom-[78px] left-1/2 -translate-x-1/2 z-[27] bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] px-4 py-2 text-[12.5px] text-[color:var(--color-reef-sand-dim)] whitespace-nowrap transition-all duration-500 pointer-events-none"
        style={{ opacity: showHint ? 1 : 0 }}
      >
        Tap a station to zoom in · drag to pan · scroll to zoom
      </div>

      {/* Stats panel */}
      <div className="reef-r-xl absolute left-4 bottom-4 z-[28] flex gap-4 bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] px-4 py-3">
        <div>
          <b className="block font-reef-display text-[19px] font-semibold text-[color:var(--color-reef-sand)] leading-tight">
            {stations.length}
          </b>
          <span className="text-[11px] text-[color:var(--color-reef-sand-dim)]">stations</span>
        </div>
        <div>
          <b className="block font-reef-display text-[19px] font-semibold text-[color:var(--color-reef-sand)] leading-tight">
            {stations.reduce((s, st) => s + st.quadratsCount, 0)}
          </b>
          <span className="text-[11px] text-[color:var(--color-reef-sand-dim)]">images</span>
        </div>
        <div className="hidden sm:block">
          <b className="block font-reef-display text-[19px] font-semibold text-[color:var(--color-reef-sand)] leading-tight">
            {Math.round(stations.reduce((s, st) => s + activeSum(st.health, filters.layers), 0))}
          </b>
          <span className="text-[11px] text-[color:var(--color-reef-sand-dim)]">% cover shown</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-4 bottom-4 z-20 pointer-events-auto">
        <CartographicControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onResetZoom={resetView}
        />
      </div>

      {/* Right-side station detail drawer */}
      {activeStation && (
        <StationHUD
          station={activeStation}
          isOpen={isHudOpen}
          onClose={() => setIsHudOpen(false)}
          onOpenTriage={onOpenTriage}
          onOpenDetail={onOpenStationDetail}
          onOpenPastTransects={onOpenPastTransects}
        />
      )}
    </div>
  );
};
