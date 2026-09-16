import React, { useState, useRef, useMemo } from 'react';
import { StationData, MapFilters, CursorTelemetry } from '../../types';
import { StationHUD } from './StationHUD';
import { LegendLayerPanel } from './LegendLayerPanel';
import { StationSwitcher } from './StationSwitcher';
import { CartographicControls } from './CartographicControls';

interface ReefMapCanvasProps {
  stations: StationData[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  filters: MapFilters;
  onChangeFilters: (newFilters: MapFilters) => void;
  onOpenTriage: () => void;
  onOpenStationDetail: () => void;
  onOpenPastTransects: () => void;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map Pan and Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHudOpen, setIsHudOpen] = useState(true);

  // Real-time Cursor Telemetry
  const [cursorTelemetry, setCursorTelemetry] = useState<CursorTelemetry>({
    lat: '16°48\'58.4"S',
    lng: '146°12\'44.1"E',
    depth: '-11.2m',
  });

  const activeStation = useMemo(() => {
    return (
      stations.find((s) => s.id === selectedStationId) || stations[0]
    );
  }, [stations, selectedStationId]);

  // Handle Zoom
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.7));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.max(0.7, Math.min(3, z * zoomFactor)));
  };

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on the background canvas, not on cards/buttons
    if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left - pan.x) / zoom;
    const relY = (e.clientY - rect.top - pan.y) / zoom;

    // Convert SVG coordinates to realistic latitude/longitude
    // Origin roughly 16°40'S to 16°58'S, 146°00'E to 146°24'E
    const latDeg = 16;
    const latMin = Math.floor(41 + (relY / 900) * 16);
    const latSec = ((relY % 50) * 1.2).toFixed(1);

    const lngDeg = 146;
    const lngMin = Math.floor(4 + (relX / 1600) * 18);
    const lngSec = ((relX % 60) * 1.0).toFixed(1);

    // Realistic bathymetric depth calculation based on Y position and platform distance
    let calculatedDepth = -8.0;
    if (relY < 240) {
      calculatedDepth = -(38 + ((240 - relY) / 240) * 20);
    } else if (relY < 420) {
      calculatedDepth = -(24 + ((420 - relY) / 180) * 14);
    } else if (relY < 620) {
      calculatedDepth = -(12 + ((620 - relY) / 200) * 12);
    } else {
      calculatedDepth = -(4 + ((900 - relY) / 280) * 8);
    }

    setCursorTelemetry({
      lat: `${latDeg}°${latMin}'${latSec}"S`,
      lng: `${lngDeg}°${lngMin}'${lngSec}"E`,
      depth: `${calculatedDepth.toFixed(1)}m`,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Switch station and ensure HUD is open
  const handleSelectStationInternal = (stationId: string) => {
    onSelectStation(stationId);
    setIsHudOpen(true);
  };

  const heatmapOpacity = (filters.heatmapIntensity / 100).toFixed(2);

  // Check if active layer includes particular color category
  const showLC = filters.layers.lc;
  const showPB = filters.layers.pb;
  const showDC = filters.layers.dc;
  const showDCA = filters.layers.dca;

  return (
    <div
      ref={containerRef}
      id="reef-map-stage-container"
      className="relative w-full h-[calc(100vh-7.5rem)] overflow-hidden select-none bg-[#E5E9EC]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* SVG Deep Hydrographic / Bathymetric Map Canvas */}
      <div
        id="hydrographic-vector-canvas"
        className="absolute inset-0 w-full h-full origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg
          className="w-full h-full min-w-[1600px] min-h-[900px] object-cover"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1600 900"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Survey Grid Pattern */}
            <pattern
              id="surveyGrid"
              patternUnits="userSpaceOnUse"
              width="80"
              height="80"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="#BAC8D7"
                strokeDasharray="2 4"
                strokeWidth="0.75"
              />
              <circle cx="0" cy="0" fill="#53606D" opacity="0.6" r="1.5" />
            </pattern>

            {/* Micro Precision Grid */}
            <pattern
              id="microGrid"
              patternUnits="userSpaceOnUse"
              width="16"
              height="16"
            >
              <path
                d="M 16 0 L 0 0 0 16"
                fill="none"
                opacity="0.4"
                stroke="#BAC8D7"
                strokeWidth="0.3"
              />
            </pattern>

            {/* Heatmap Radial Gradients */}
            <radialGradient id="heat-baker" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="#E8A93C"
                stopOpacity={showPB ? 0.85 : 0.1}
              />
              <stop
                offset="35%"
                stopColor="#F2637A"
                stopOpacity={showLC ? 0.6 : 0.05}
              />
              <stop
                offset="70%"
                stopColor="#8B8378"
                stopOpacity={showDC ? 0.3 : 0.02}
              />
              <stop
                offset="100%"
                stopColor="#E8A93C"
                stopOpacity="0"
              />
            </radialGradient>

            <radialGradient id="heat-norman" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="#E8A93C"
                stopOpacity={showPB ? 0.75 : 0.1}
              />
              <stop
                offset="50%"
                stopColor="#6B7A3A"
                stopOpacity={showDCA ? 0.45 : 0.05}
              />
              <stop offset="100%" stopColor="#6B7A3A" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heat-hastings" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="#6B7A3A"
                stopOpacity={showDCA ? 0.85 : 0.1}
              />
              <stop
                offset="45%"
                stopColor="#8B8378"
                stopOpacity={showDC ? 0.55 : 0.05}
              />
              <stop offset="100%" stopColor="#6B7A3A" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heat-arlington" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="#F2637A"
                stopOpacity={showLC ? 0.9 : 0.1}
              />
              <stop
                offset="45%"
                stopColor="#F2637A"
                stopOpacity={showLC ? 0.5 : 0.05}
              />
              <stop offset="100%" stopColor="#F2637A" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="heat-fitzroy" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor="#F2637A"
                stopOpacity={showLC ? 0.7 : 0.1}
              />
              <stop
                offset="40%"
                stopColor="#E8A93C"
                stopOpacity={showPB ? 0.4 : 0.05}
              />
              <stop offset="100%" stopColor="#8B8378" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Base Hydrology Fill */}
          <rect fill="#DDE4E8" height="100%" width="100%" />
          <rect fill="url(#microGrid)" height="100%" width="100%" />
          <rect fill="url(#surveyGrid)" height="100%" width="100%" />

          {/* Shallow Crest Platforms */}
          {/* Platform A: Arlington Reef Platform */}
          <path
            d="M 380,590 C 440,560 590,580 660,650 C 720,710 680,810 570,830 C 460,850 360,780 340,700 C 320,630 350,600 380,590 Z"
            fill="#F4EFE6"
            stroke="#16232E"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <text
            fill="#1D1C13"
            fontFamily="Merriweather"
            fontSize="13"
            fontStyle="italic"
            opacity="0.35"
            x="440"
            y="720"
          >
            Arlington Complex (Shelf)
          </text>

          {/* Platform B: Baker Ribbon Crest */}
          <path
            d="M 880,310 C 970,270 1120,290 1200,370 C 1260,430 1210,540 1090,560 C 970,580 890,510 860,430 C 840,360 850,330 880,310 Z"
            fill="#FAF5EB"
            stroke="#16232E"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <text
            fill="#1D1C13"
            fontFamily="Merriweather"
            fontSize="13"
            fontStyle="italic"
            opacity="0.35"
            x="960"
            y="420"
          >
            Baker Ribbon Crest
          </text>

          {/* Platform C: Hastings Outer Spur */}
          <path
            d="M 1290,180 C 1360,150 1480,180 1520,260 C 1550,320 1490,410 1410,420 C 1320,430 1270,360 1260,290 C 1250,230 1260,190 1290,180 Z"
            fill="#F4EFE6"
            stroke="#16232E"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />

          {/* Topographic / Sounding depth points */}
          <g fill="#53606D" fontFamily="JetBrains Mono" fontSize="9">
            <text x="180" y="240">· 52.4m</text>
            <text x="490" y="310">· 38.2m</text>
            <text x="740" y="210">· 44.9m</text>
            <text x="620" y="520">· 14.1m</text>
            <text x="210" y="680">· 8.6m</text>
            <text x="980" y="650">· 19.8m</text>
            <text x="1360" y="560">· 28.5m</text>
            <text x="820" y="780">· 11.2m</text>
          </g>

          {/* Multi-Color Class Heatmap Density Blooms */}
          <g id="heatmap-blooms" opacity={heatmapOpacity}>
            {/* Arlington Station Heat */}
            <circle
              cx="510"
              cy="710"
              fill="url(#heat-arlington)"
              style={{ mixBlendMode: 'multiply' }}
              r="110"
            />
            {/* Norman Station Heat */}
            <circle
              cx="680"
              cy="460"
              fill="url(#heat-norman)"
              style={{ mixBlendMode: 'multiply' }}
              r="95"
            />
            {/* Fitzroy-North Station Heat */}
            <circle
              cx="280"
              cy="740"
              fill="url(#heat-fitzroy)"
              style={{ mixBlendMode: 'multiply' }}
              r="85"
            />
            {/* Hastings-07 Station Heat */}
            <circle
              cx="1380"
              cy="290"
              fill="url(#heat-hastings)"
              style={{ mixBlendMode: 'multiply' }}
              r="120"
            />
            {/* Baker-04 Station Heat (PRIMARY ACTIVE FOCUS) */}
            <circle
              cx="1040"
              cy="420"
              fill="url(#heat-baker)"
              style={{ mixBlendMode: 'multiply' }}
              r="140"
            />
          </g>

          {/* Vector Survey Transect Lines */}
          <g id="transect-vectors">
            <line
              x1="510"
              y1="710"
              x2="680"
              y2="460"
              stroke="#00475A"
              strokeDasharray="4 4"
              strokeWidth="1"
              opacity="0.6"
            />
            <line
              x1="680"
              y1="460"
              x2="1040"
              y2="420"
              stroke="#00475A"
              strokeDasharray="4 4"
              strokeWidth="1"
              opacity="0.6"
            />
            <line
              x1="1040"
              y1="420"
              x2="1380"
              y2="290"
              stroke="#00475A"
              strokeDasharray="4 4"
              strokeWidth="1"
              opacity="0.6"
            />
          </g>

          {/* Interactive Station Reticles & Nodes */}
          {stations.map((station) => {
            const isSelected = activeStation.id === station.id;
            const isLeftLabel = station.id === 'HASTINGS-07';

            return (
              <g
                key={station.id}
                id={`station-node-${station.id.toLowerCase()}`}
                className="cursor-pointer group"
                transform={`translate(${station.x}, ${station.y})`}
                onClick={() => handleSelectStationInternal(station.id)}
              >
                {/* Station Reticle */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? '16' : '14'}
                  fill="none"
                  stroke="#1D1C13"
                  strokeWidth={isSelected ? '2' : '1'}
                  className="group-hover:stroke-[#00475A]"
                />
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? '5' : '4'}
                  fill={isSelected ? '#00475A' : '#16232E'}
                />
                {/* Crosshairs */}
                <line
                  x1={isSelected ? '-24' : '-18'}
                  y1="0"
                  x2={isSelected ? '24' : '18'}
                  y2="0"
                  stroke="#1D1C13"
                  strokeWidth="0.75"
                />
                <line
                  x1="0"
                  y1={isSelected ? '-24' : '-18'}
                  x2="0"
                  y2={isSelected ? '24' : '18'}
                  stroke="#1D1C13"
                  strokeWidth="0.75"
                />

                {/* Station Badge Label */}
                <rect
                  x={isLeftLabel ? -106 : 22}
                  y="-9"
                  width={station.id.length > 10 ? '98' : '88'}
                  height="18"
                  fill={isSelected ? '#00475A' : '#FAF8F3'}
                  stroke="#1D1C13"
                  strokeWidth="1"
                  className="transition-colors group-hover:fill-[#F3EEDF]"
                />
                <text
                  x={isLeftLabel ? -100 : 26}
                  y="4"
                  fill={isSelected ? '#FAF8F3' : '#1D1C13'}
                  fontFamily="JetBrains Mono"
                  fontSize="10"
                  fontWeight="600"
                >
                  {station.id}
                </text>
              </g>
            );
          })}

          {/* Active Station Pulsing Pointer Leader */}
          {activeStation && (
            <g
              id="active-station-pointer"
              transform={`translate(${activeStation.x}, ${activeStation.y})`}
            >
              {/* Pulsing Target Reticle */}
              <circle
                cx="0"
                cy="0"
                r="26"
                fill="none"
                stroke="#BA1A1A"
                strokeDasharray="3 3"
                strokeWidth="1.5"
                className="animate-spin"
                style={{
                  transformOrigin: '0px 0px',
                  animationDuration: '20s',
                }}
              />
              <circle cx="0" cy="0" r="16" fill="none" stroke="#16232E" strokeWidth="2" />
              <circle cx="0" cy="0" r="5" fill="#BA1A1A" />
              <line x1="-30" y1="0" x2="30" y2="0" stroke="#16232E" strokeWidth="1" />
              <line x1="0" y1="-30" x2="0" y2="30" stroke="#16232E" strokeWidth="1" />

              {/* Callout Pointer Line to HUD */}
              <polyline
                fill="none"
                points="0,-16 -40,-80 -120,-80"
                stroke="#16232E"
                strokeWidth="1.5"
              />
              <circle cx="-120" cy="-80" fill="#16232E" r="2.5" />
            </g>
          )}
        </svg>
      </div>

      {/* Center Ambient Crosshair Overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
        <div className="w-8 h-8 relative">
          <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-[#1D1C13]" />
          <div className="absolute top-4 left-0 right-0 h-[1px] bg-[#1D1C13]" />
          <svg className="absolute inset-0 w-8 h-8" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              fill="none"
              r="12"
              stroke="#16232E"
              strokeWidth="0.75"
            />
          </svg>
        </div>
      </div>

      {/* Top Left Floating Legend & Layer Control */}
      <div className="absolute left-6 top-6 z-30 pointer-events-auto">
        <LegendLayerPanel
          filters={filters}
          onChangeFilters={onChangeFilters}
        />
      </div>

      {/* Top Right Quick Station Switcher */}
      <div className="absolute right-6 top-6 z-30 pointer-events-auto">
        <StationSwitcher
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={handleSelectStationInternal}
        />
      </div>

      {/* Active Station HUD Technical Popup (Anchored directly near active station) */}
      {isHudOpen && activeStation && (
        <div
          id="anchored-hud-container"
          className="absolute z-30 pointer-events-auto transition-all duration-200"
          style={{
            // Position near the active station's callout point
            left: `${Math.min(
              Math.max(
                ((activeStation.x * zoom + pan.x) / 1600) * 100 - 15,
                24
              ),
              68
            )}%`,
            top: `${Math.min(
              Math.max(
                ((activeStation.y * zoom + pan.y) / 900) * 100 - 32,
                8
              ),
              48
            )}%`,
          }}
        >
          <StationHUD
            station={activeStation}
            onClose={() => setIsHudOpen(false)}
            onOpenTriage={onOpenTriage}
            onOpenDetail={onOpenStationDetail}
            onOpenPastTransects={onOpenPastTransects}
          />
        </div>
      )}

      {/* Bottom Right Cartographic Instrumentation Cluster */}
      <div className="absolute right-6 bottom-6 z-20 pointer-events-auto">
        <CartographicControls
          cursorTelemetry={cursorTelemetry}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>
    </div>
  );
};
