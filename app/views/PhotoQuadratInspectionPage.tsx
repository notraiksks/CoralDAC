import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  Box,
  Grid as GridIcon,
  ZoomIn,
  ZoomOut,
  Contrast,
  FileSpreadsheet,
  Flag,
  MapPin,
  ShieldCheck,
  Check,
  X,
  Layers,
} from 'lucide-react';
import {
  SPECIMEN_BOUNDING_BOXES,
  SPECIMEN_PATCHES,
  SpecimenPatch,
} from '../data/specimenInspectionData';

const PATCH_BY_BOX_ID = new Map(
  SPECIMEN_PATCHES.filter((patch) => patch.boxTargetId).map((patch) => [patch.boxTargetId, patch])
);

interface PhotoQuadratInspectionPageProps {
  onBackToStation?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToCuration?: () => void;
}

export const PhotoQuadratInspectionPage: React.FC<PhotoQuadratInspectionPageProps> = ({
  onBackToStation,
  onNavigateToMap,
}) => {
  // Layer toggles
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showMetricGrid, setShowMetricGrid] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  // Active hover & focus states
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [selectedPatch, setSelectedPatch] = useState<SpecimenPatch | null>(null);

  // Live mouse coordinate tracker
  const [mouseCoords, setMouseCoords] = useState<{ x: string; y: string }>({
    x: '0.500',
    y: '0.500',
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Re-annotation Flag Modal
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const [flagReason, setFlagReason] = useState<string>('Condition classification ambiguity');
  const [flagNotes, setFlagNotes] = useState<string>('');
  const [flagSubmitted, setFlagSubmitted] = useState<boolean>(false);

  // Patch Grid Filters & Sort
  const [patchFilter, setPatchFilter] = useState<'ALL' | 'LC' | 'PB' | 'DC' | 'DCA'>('ALL');
  const [patchSort, setPatchSort] = useState<'CONF_DESC' | 'AREA_DESC' | 'ID_ASC'>('CONF_DESC');

  // Trigger feedback toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Mouse move handler on specimen canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, rawX)).toFixed(3);
    const clampedY = Math.max(0, Math.min(1, rawY)).toFixed(3);
    setMouseCoords({ x: clampedX, y: clampedY });
  };

  // Filter and sort patches
  const filteredPatches = useMemo(() => {
    let list = [...SPECIMEN_PATCHES];

    if (patchFilter !== 'ALL') {
      list = list.filter((p) => p.classType === patchFilter);
    }

    if (patchSort === 'CONF_DESC') {
      list.sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));
    } else if (patchSort === 'AREA_DESC') {
      list.sort((a, b) => b.areaCm2 - a.areaCm2);
    } else if (patchSort === 'ID_ASC') {
      list.sort((a, b) => a.patchNum.localeCompare(b.patchNum));
    }

    return list;
  }, [patchFilter, patchSort]);

  // Export Patch Matrix CSV
  const handleExportCSV = () => {
    const headers = [
      'Patch_ID',
      'Quadrat_Image',
      'Class_Code',
      'Condition_Label',
      'Confidence_Pct',
      'Estimated_Area_cm2',
      'Detection_Box_Ref',
      'Station_ID',
      'Timestamp_UTC',
    ];

    const rows = SPECIMEN_PATCHES.map((p) => [
      p.patchNum,
      'IMG_4018_HP_S3.JPG',
      p.classType,
      `"${p.name}"`,
      p.confidence,
      p.areaCm2,
      p.boxTargetId || 'N/A',
      'HP-S3',
      '2026-03-04 10:41:22 UTC',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'IMG_4018_HP_S3_patch_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded patch matrix CSV (19 specimen records)');
  };

  // Copy reference link
  const handleLinkAudit = () => {
    const auditUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(auditUrl);
    }
    showToast('Station reference copied to clipboard: HP-S3/IMG_4018');
  };

  // Submit re-annotation flag
  const handleSubmitFlag = (e: React.FormEvent) => {
    e.preventDefault();
    setFlagSubmitted(true);
    setTimeout(() => {
      setIsFlagModalOpen(false);
      setFlagSubmitted(false);
      setFlagNotes('');
      showToast('Specimen flagged for benthic review (Queue #QA-892)');
    }, 1000);
  };

  return (
    <div
      id="photo-quadrat-inspection-page"
      className="w-full min-h-screen bg-[#E7E2D4] pb-24"
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#16232E] text-[#FAF8F3] px-4 py-2.5 font-mono text-xs shadow-lg border-l-4 border-[#00475A] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Check className="text-[#9CD7EF]" size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1720px] mx-auto p-3 sm:p-5 flex flex-col gap-4">
        {/* 1. Navigational Header Row */}
        <header
          id="inspection-nav-header"
          className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] p-3.5 sm:p-4 shadow-sm border border-[#D1CBBF]"
        >
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <button
              id="btn-back-to-station"
              type="button"
              onClick={() => {
                if (onBackToStation) onBackToStation();
                else if (onNavigateToMap) onNavigateToMap();
              }}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#00475A] hover:text-[#1E5F74] transition-colors font-semibold cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>BACK TO STATION: HARKA PILOTO — SHALLOW, T3</span>
            </button>
            <span className="text-[#C0C8CC] font-mono text-xs">/</span>
            <div className="flex items-center gap-2 font-mono text-xs text-[#53606D] truncate">
              <span className="text-[#1D1C13] font-semibold">STATION HP-S3</span>
              <span className="text-[#C0C8CC]">/</span>
              <span className="font-semibold text-[#1E5F74]">
                PHOTO-QUADRAT IMG_4018_HP_S3.JPG
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#505E21]/15 text-[#39460B] font-mono text-[10px] font-semibold tracking-wider uppercase border border-[#505E21]/30">
              <CheckCircle2 size={13} />
              APPROVED &amp; COMMITTED TO HEATMAP
            </span>
            <button
              id="btn-link-audit"
              type="button"
              onClick={handleLinkAudit}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] font-mono text-[11px] uppercase border border-[#D1CBBF] transition-colors cursor-pointer"
              title="Copy station reference"
            >
              <Share2 size={13} />
              <span>SHARE REFERENCE</span>
            </button>
          </div>
        </header>

        {/* 2. Main Two-Column Workstation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left / Main Column: Expansive Specimen Viewport (Col 8) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* Interactive Specimen Canvas Frame */}
            <div className="bg-[#FFFFFF] shadow-md border border-[#D1CBBF] overflow-hidden relative">
              {/* Interactive Overlay Control Bar */}
              <div className="bg-[#F9F3E5] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[#1D1C13] border-b border-[#D1CBBF]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Toggle Bounding Boxes */}
                  <button
                    id="toggleBoundingBoxesBtn"
                    type="button"
                    onClick={() => setShowBoundingBoxes((prev) => !prev)}
                    className={`px-2.5 py-1 font-mono text-[11px] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer border ${
                      showBoundingBoxes
                        ? 'bg-[#00475A] text-white border-[#00475A]'
                        : 'bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] border-[#D1CBBF]'
                    }`}
                  >
                    <Box size={13} />
                    <span>TOGGLE BOUNDING BOXES [{showBoundingBoxes ? 'ACTIVE' : 'OFF'}]</span>
                  </button>

                  {/* Toggle 10cm Grid */}
                  <button
                    id="toggleGridBtn"
                    type="button"
                    onClick={() => setShowMetricGrid((prev) => !prev)}
                    className={`px-2.5 py-1 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      showMetricGrid
                        ? 'bg-[#00475A] text-white border-[#00475A]'
                        : 'bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] border-[#D1CBBF]'
                    }`}
                  >
                    <GridIcon size={13} />
                    <span>SHOW 10CM GRID [{showMetricGrid ? 'ACTIVE' : 'OFF'}]</span>
                  </button>

                  {/* Toggle Zoom */}
                  <button
                    id="zoomToggleBtn"
                    type="button"
                    onClick={() => setIsZoomed((prev) => !prev)}
                    className={`px-2.5 py-1 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isZoomed
                        ? 'bg-[#00475A] text-white border-[#00475A]'
                        : 'bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] border-[#D1CBBF]'
                    }`}
                  >
                    {isZoomed ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
                    <span>{isZoomed ? 'RESET ZOOM (1:1)' : 'ZOOM 1:1'}</span>
                  </button>

                  {/* Toggle High Contrast */}
                  <button
                    id="contrastMaskBtn"
                    type="button"
                    onClick={() => setIsHighContrast((prev) => !prev)}
                    className={`px-2.5 py-1 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isHighContrast
                        ? 'bg-[#00475A] text-white border-[#00475A]'
                        : 'bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] border-[#D1CBBF]'
                    }`}
                  >
                    <Contrast size={13} />
                    <span>HIGH-CONTRAST MASK [{isHighContrast ? 'ON' : 'OFF'}]</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[#53606D] font-mono text-[11px]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#505E21]" />
                  <span className="font-semibold text-[#39460B]">QUADRAT 1.00m² CALIBRATED</span>
                </div>
              </div>

              {/* 1m² Photographic Stage with Overlays */}
              <div
                id="specimenCanvas"
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                className="relative w-full aspect-square bg-[#0B141A] overflow-hidden select-none cursor-crosshair"
              >
                <img
                  id="quadratImage"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx0XZI3XbZ4fm3SeJmblXLsFNfo95MIfZr3T3xQK55aTWwPejIB364-qUOkpkbPExHo613LfqHuQ59OX58EvHP42h_ciW-Vx4SPNdKEz6n52YMyVvY96180AnhubB2fqgAsZCscp-x7D-BCIrkTAY_IQ09X3G4M7D4ck-Nyjeiv6v4EL9bHGNmvGT9Pa_sDtyO0phH8uCsny0_UBpqgSPJbiOW3QNXBfo0f8nyPqUeenH2AFSZ64C6"
                  alt="Calibrated 1 square meter benthic photo-quadrat survey image showing healthy live coral colonies, partially bleached patches, dead skeletal structures, and algal turf on limestone pavement."
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isZoomed ? 'scale-150 origin-center' : 'scale-100'
                  }`}
                  style={{
                    filter: isHighContrast
                      ? 'contrast(175%) saturate(140%) brightness(90%)'
                      : 'none',
                  }}
                />

                {/* 10cm Metric Grid Layer */}
                <div
                  id="metricGridOverlay"
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                    showMetricGrid ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)',
                    backgroundSize: '10% 10%',
                  }}
                >
                  <div className="absolute top-2 left-2 font-mono text-[9px] text-[#FFFFFF] bg-black/75 px-1.5 py-0.5 border border-white/20">
                    0.0m
                  </div>
                  <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[#FFFFFF] bg-black/75 px-1.5 py-0.5 border border-white/20">
                    1.0m (100cm)
                  </div>
                  <div className="absolute top-1/2 left-2 font-mono text-[9px] text-[#FFFFFF] bg-black/65 px-1">
                    0.5m
                  </div>
                  <div className="absolute top-2 left-1/2 font-mono text-[9px] text-[#FFFFFF] bg-black/65 px-1">
                    0.5m
                  </div>
                </div>

                {/* Bounding Boxes Container */}
                {showBoundingBoxes && (
                  <div id="boundingBoxLayer" className="absolute inset-0 pointer-events-auto">
                    {SPECIMEN_BOUNDING_BOXES.map((box) => {
                      const isHighlighted = activeBoxId === box.id;
                      return (
                        <div
                          key={box.id}
                          id={box.id}
                          onMouseEnter={() => setActiveBoxId(box.id)}
                          onMouseLeave={() => setActiveBoxId(null)}
                          onClick={() => {
                            const p = PATCH_BY_BOX_ID.get(box.id);
                            if (p) setSelectedPatch(p);
                          }}
                          className="box-target absolute transition-all duration-150 cursor-pointer"
                          style={{
                            top: box.top,
                            left: box.left,
                            width: box.width,
                            height: box.height,
                            outline: isHighlighted
                              ? `3px solid #FFFFFF`
                              : `2px solid ${box.color}`,
                            backgroundColor: box.bgRgba,
                            boxShadow: isHighlighted
                              ? `0 0 0 3px ${box.color}, 0 0 20px rgba(0,0,0,0.8)`
                              : 'none',
                            transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                            zIndex: isHighlighted ? 30 : 10,
                          }}
                        >
                          <div
                            className="absolute -top-6 left-0 bg-[#16232E] text-white px-1.5 py-0.5 font-mono text-[10px] flex items-center gap-1.5 shadow whitespace-nowrap"
                            style={{ borderLeft: `3px solid ${box.color}` }}
                          >
                            <span style={{ color: box.color }} className="font-bold">
                              {box.symbol} {box.label}
                            </span>
                            <span className="font-sans font-medium text-[10px] leading-none">
                              {box.benthicClass}
                            </span>
                            <span className="text-[#E7E2D4] font-mono text-[9px]">
                              {box.confidence}
                            </span>
                          </div>
                          <div className="absolute bottom-0 right-0 bg-black/70 text-white font-mono text-[9px] px-1">
                            {box.boxNum}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Registration Corner Crosshairs */}
                <div
                  className="absolute top-2 left-2 w-3 h-3 pointer-events-none"
                  style={{
                    borderTop: '1.5px solid rgba(255,255,255,0.7)',
                    borderLeft: '1.5px solid rgba(255,255,255,0.7)',
                  }}
                />
                <div
                  className="absolute top-2 right-2 w-3 h-3 pointer-events-none"
                  style={{
                    borderTop: '1.5px solid rgba(255,255,255,0.7)',
                    borderRight: '1.5px solid rgba(255,255,255,0.7)',
                  }}
                />
                <div
                  className="absolute bottom-2 left-2 w-3 h-3 pointer-events-none"
                  style={{
                    borderBottom: '1.5px solid rgba(255,255,255,0.7)',
                    borderLeft: '1.5px solid rgba(255,255,255,0.7)',
                  }}
                />
                <div
                  className="absolute bottom-2 right-2 w-3 h-3 pointer-events-none"
                  style={{
                    borderBottom: '1.5px solid rgba(255,255,255,0.7)',
                    borderRight: '1.5px solid rgba(255,255,255,0.7)',
                  }}
                />

                {/* Coordinate Mouse Readout */}
                <div
                  id="canvasCoords"
                  className="absolute bottom-3 left-3 bg-[#16232E]/90 text-[#FAF8F3] px-2.5 py-1 font-mono text-[10px] flex items-center gap-2 pointer-events-none backdrop-blur-sm border border-[#16232E]"
                >
                  <span className="text-[#C0C8CC]">POSITION:</span>
                  <span className="tracking-wider text-[#FAF8F3]">
                    X: {mouseCoords.x}m · Y: {mouseCoords.y}m
                  </span>
                  <span className="text-[#C0C8CC]">|</span>
                  <span className="text-[#94CFE7] font-semibold">QUADRAT: 1.0m × 1.0m</span>
                </div>
              </div>

              {/* Survey Specimen Strip Under Image */}
              <div className="bg-[#FFFFFF] p-2.5 px-3 font-mono text-[#53606D] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border-t border-[#D1CBBF]">
                <div className="flex flex-col">
                  <span className="text-[#70787C] uppercase text-[9px]">File Name</span>
                  <span className="text-[#1D1C13] font-semibold truncate">IMG_4018_HP_S3.JPG</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#70787C] uppercase text-[9px]">File Format</span>
                  <span className="text-[#1D1C13] font-semibold">8.4 MB · JPEG</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#70787C] uppercase text-[9px]">Dimensions</span>
                  <span className="text-[#1D1C13] font-semibold">4000 × 3000 px</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#70787C] uppercase text-[9px]">Sampling Frame</span>
                  <span className="text-[#1D1C13] font-semibold">1.0m × 1.0m Quadrat</span>
                </div>
              </div>
            </div>

            {/* Quick Action Deck */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFFFFF] p-2.5 px-3.5 shadow-sm border border-[#D1CBBF]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-download-patch-csv"
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-[#00475A] hover:bg-[#003543] text-white font-mono text-[11px] uppercase flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  <span>DOWNLOAD PATCH MATRIX CSV</span>
                </button>
              </div>

              <button
                id="btn-flag-reannotation"
                type="button"
                onClick={() => setIsFlagModalOpen(true)}
                className="px-3 py-1.5 bg-[#FFDAD6]/60 hover:bg-[#FFDAD6] text-[#93000A] font-mono text-[11px] uppercase flex items-center gap-1.5 border border-[#BA1A1A]/30 transition-colors cursor-pointer"
              >
                <Flag size={14} />
                <span>FLAG FOR QA RE-ANNOTATION</span>
              </button>
            </div>
          </div>

          {/* Right Column: Comprehensive Scientific Metadata Panel (Col 4) */}
          <div className="lg:col-span-4 flex flex-col gap-3.5">
            {/* Colony Composition Summary Card */}
            <div className="bg-[#FFFFFF] p-3.5 sm:p-4 shadow-sm border border-[#D1CBBF]">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E7E2D4]">
                <span className="font-mono text-xs uppercase text-[#00475A] tracking-wider font-semibold">
                  BENTHIC POINT CENSUS
                </span>
                <span className="font-mono text-xs text-[#53606D] font-bold">19 COLONIES</span>
              </div>

              {/* 4 Metric Chips */}
              <div className="grid grid-cols-2 gap-2 mb-3.5">
                <div className="p-2 bg-[#F9F3E5] border border-[#D1CBBF]/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#F2637A] font-bold">
                    <span>■</span>
                    <span>[LC] LIVE</span>
                  </div>
                  <span className="font-serif text-lg font-bold text-[#1D1C13]">12</span>
                </div>

                <div className="p-2 bg-[#F9F3E5] border border-[#D1CBBF]/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#E8A93C] font-bold">
                    <span>◇</span>
                    <span>[PB] BLEACH</span>
                  </div>
                  <span className="font-serif text-lg font-bold text-[#1D1C13]">4</span>
                </div>

                <div className="p-2 bg-[#F9F3E5] border border-[#D1CBBF]/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#53606D] font-bold">
                    <span>✕</span>
                    <span>[DC] DEAD</span>
                  </div>
                  <span className="font-serif text-lg font-bold text-[#1D1C13]">2</span>
                </div>

                <div className="p-2 bg-[#F9F3E5] border border-[#D1CBBF]/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#6B7A3A] font-bold">
                    <span>▤</span>
                    <span>[DCA] ALGAE</span>
                  </div>
                  <span className="font-serif text-lg font-bold text-[#1D1C13]">1</span>
                </div>
              </div>

              {/* Metric Coral Cover Bar Visualization */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-mono text-[10px] text-[#53606D]">
                  <span className="uppercase">PERCENT SURFICIAL COVERAGE</span>
                  <span className="font-bold text-[#1D1C13]">63.2% LIVING HERMATYPIC</span>
                </div>
                <div className="w-full h-3.5 bg-[#E7E2D4] flex overflow-hidden border border-[#D1CBBF]">
                  <div
                    className="bg-[#F2637A] h-full"
                    style={{ width: '63.2%' }}
                    title="Live Coral: 63.2%"
                  />
                  <div
                    className="bg-[#E8A93C] h-full"
                    style={{ width: '21.0%' }}
                    title="Partially Bleached: 21.0%"
                  />
                  <div
                    className="bg-[#8B8378] h-full"
                    style={{ width: '10.5%' }}
                    title="Dead Coral: 10.5%"
                  />
                  <div
                    className="bg-[#6B7A3A] h-full"
                    style={{ width: '5.3%' }}
                    title="Algal Turf: 5.3%"
                  />
                </div>
                <div className="flex justify-between font-mono text-[9px] text-[#70787C] pt-0.5">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Station Survey Metadata Table */}
            <div className="bg-[#FFFFFF] p-3.5 sm:p-4 shadow-sm border border-[#D1CBBF]">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E7E2D4]">
                <h3 className="font-serif text-sm font-bold text-[#1D1C13]">
                  Survey Reference &amp; Protocol Ledger
                </h3>
                <ShieldCheck size={17} className="text-[#00475A]" />
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between py-1 bg-[#F9F3E5] px-2.5 border border-[#D1CBBF]/40">
                  <span className="text-[#53606D]">SURVEY PROTOCOL</span>
                  <span className="text-[#1D1C13] font-medium text-right">
                    Standard Benthic Photo-Quadrat
                  </span>
                </div>

                <div className="flex justify-between py-1 px-2.5">
                  <span className="text-[#53606D]">DATE &amp; TIMESTAMP</span>
                  <span className="text-[#1D1C13] text-right">2026-03-04 · 10:41:22 UTC</span>
                </div>

                <div className="flex justify-between py-1 bg-[#F9F3E5] px-2.5 border border-[#D1CBBF]/40">
                  <span className="text-[#53606D]">STATION ID</span>
                  <span className="text-[#1D1C13] font-semibold text-right">
                    Harka Piloto — S3 (HP-S3)
                  </span>
                </div>

                <div className="flex justify-between py-1 px-2.5">
                  <span className="text-[#53606D]">TRANSECT / QUADRAT</span>
                  <span className="text-[#1D1C13] font-semibold text-right">
                    TR-03A · Quadrat #01
                  </span>
                </div>

                {/* Location Reference Section */}
                <div className="p-2.5 bg-[#D3E1F0]/40 flex flex-col gap-1.5 border border-[#BAC8D7]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#576471] text-[10px] tracking-wider uppercase">
                      STATION BENCHMARK
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#00475A] text-white px-1.5 py-0.5">
                      <MapPin size={12} />
                      STATION DATUM
                    </span>
                  </div>
                  <div className="flex justify-between text-[#1D1C13] text-[11px]">
                    <span className="text-[#53606D]">COORDINATES</span>
                    <span className="font-semibold">13.5123° N, 120.9573° E</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#53606D]">
                    <span>DATUM STANDARD</span>
                    <span>WGS 84</span>
                  </div>
                </div>

                {/* ML Model Pipeline Stack */}
                <div className="p-2.5 bg-[#F9F3E5] flex flex-col gap-1 text-[11px] border border-[#D1CBBF]/40">
                  <div className="flex justify-between text-[#53606D]">
                    <span className="font-semibold text-[#1D1C13]">MODEL PIPELINE STACK</span>
                    <span className="text-[10px] text-[#00475A] font-bold">PRODUCTION</span>
                  </div>
                  <div className="flex justify-between text-[#1D1C13] text-[10px]">
                    <span>Object Detector</span>
                    <span>YOLOv8 v3 (IoU 0.88)</span>
                  </div>
                  <div className="flex justify-between text-[#1D1C13] text-[10px]">
                    <span>Benthic Health Classifier</span>
                    <span>ResNet50 v2 (4 Health Classes)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Assurance Sign-Off Card */}
            <div className="bg-[#FFFFFF] p-3.5 sm:p-4 shadow-sm relative overflow-hidden border border-[#D1CBBF]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1E5F74]" />
              <div className="pl-2">
                <div className="flex items-center justify-between pb-1 mb-2 border-b border-[#E7E2D4]">
                  <span className="font-mono text-xs uppercase text-[#1D1C13] font-bold">
                    Quality Assurance Audit
                  </span>
                  <span className="font-mono text-[10px] text-[#39460B] font-semibold">
                    BENTHIC ASSESSMENT
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#1E5F74] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    QA
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-xs font-bold text-[#1D1C13]">
                      Benthic Quality Review Panel
                    </span>
                    <span className="font-mono text-[9px] text-[#53606D]">
                      Assessment Log · 2026-03-04 11:15 UTC
                    </span>
                  </div>
                </div>

                <p className="font-serif text-xs text-[#40484C] bg-[#E7E2D4]/50 p-2.5 leading-relaxed border-l-2 border-[#1E5F74]">
                  &ldquo;Verified bounding box detections and ResNet50 health condition classifications
                  for Quadrat #01. Live coral, bleached colonies, and algal turf boundaries adhere to
                  standard benthic health assessment protocols.&rdquo;
                </p>

                <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-[#53606D] pt-1">
                  <span>AUDIT STATUS:</span>
                  <span className="text-[#39460B] font-semibold">APPROVED FOR BENTHIC ARCHIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Lower Section: Detected Patches (19 Extracted Specimens) */}
        <section className="mt-2 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#FFFFFF] p-3 sm:p-3.5 shadow-sm border border-[#D1CBBF]">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#00475A]" />
              <h2 className="font-serif text-base font-bold text-[#1D1C13]">
                Detected Patches (19 Extracted Specimens)
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] text-[#53606D] hidden md:inline">
                Hover patch to highlight corresponding bounding box on specimen frame
              </span>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {(['ALL', 'LC', 'PB', 'DC', 'DCA'] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    type="button"
                    onClick={() => setPatchFilter(filterVal)}
                    className={`px-2 py-1 border transition-colors cursor-pointer ${
                      patchFilter === filterVal
                        ? 'bg-[#00475A] text-white border-[#00475A] font-semibold'
                        : 'bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] border-[#D1CBBF]'
                    }`}
                  >
                    {filterVal}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <select
                  value={patchSort}
                  onChange={(e) =>
                    setPatchSort(e.target.value as typeof patchSort)
                  }
                  aria-label="Sort specimens"
                  className="px-2 py-1 bg-[#FAF8F3] border border-[#D1CBBF] text-[#1D1C13] focus:outline-none cursor-pointer"
                >
                  <option value="CONF_DESC">SORT: CONFIDENCE ▼</option>
                  <option value="AREA_DESC">SORT: AREA (CM²) ▼</option>
                  <option value="ID_ASC">SORT: PATCH ID ▲</option>
                </select>
              </div>
            </div>
          </div>

          {/* Responsive Specimen Patch Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredPatches.map((patch) => {
              const isSelected = selectedPatch?.id === patch.id;
              const isBoxHovered = patch.boxTargetId && activeBoxId === patch.boxTargetId;

              return (
                <div
                  key={patch.id}
                  id={`patch-card-${patch.id}`}
                  onMouseEnter={() => {
                    if (patch.boxTargetId) setActiveBoxId(patch.boxTargetId);
                  }}
                  onMouseLeave={() => {
                    if (patch.boxTargetId) setActiveBoxId(null);
                  }}
                  onClick={() => setSelectedPatch(patch)}
                  className={`patch-card bg-[#FFFFFF] p-2 flex flex-col gap-2 transition-all cursor-pointer group border ${
                    isSelected || isBoxHovered
                      ? 'border-[#00475A] shadow-md ring-2 ring-[#00475A]/20'
                      : 'border-[#D1CBBF] hover:shadow-sm hover:border-[#1E5F74]'
                  }`}
                >
                  <div className="relative w-full aspect-square bg-[#E7E2D4] overflow-hidden">
                    <img
                      src={patch.imageUrl}
                      alt={patch.altText}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute top-1 left-1 bg-black/75 text-white font-mono text-[9px] px-1">
                      {patch.patchNum}
                    </span>
                    <span
                      className="absolute top-1 right-1 px-1 text-[9px] font-mono font-bold text-white shadow-sm"
                      style={{ backgroundColor: patch.color }}
                    >
                      {patch.symbol} {patch.classType}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span
                      className="font-serif text-xs text-[#1D1C13] truncate font-medium"
                      title={patch.name}
                    >
                      {patch.name}
                    </span>
                    <div className="flex justify-between items-center font-mono text-[#53606D] text-[10px] mt-1 pt-1 border-t border-[#E7E2D4]">
                      <span className="text-[#1D1C13] font-semibold">{patch.confidence}</span>
                      <span>{patch.areaCm2} cm²</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 4. Patch Quick Inspection Modal / Lightbox */}
      {selectedPatch && (
        <div
          id="patch-lightbox-modal"
          className="fixed inset-0 z-50 bg-[#16232E]/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPatch(null)}
        >
          <div
            id="patch-lightbox-dialog"
            className="w-full max-w-lg bg-[#FAF8F3] border-2 border-[#16232E] shadow-[8px_8px_0px_#16232E] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#00475A] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#9CD7EF] uppercase font-semibold">
                  SPECIMEN PATCH //
                </span>
                <span className="font-mono text-xs font-bold">{selectedPatch.patchNum}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatch(null)}
                className="text-white hover:text-[#9CD7EF] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3.5">
              <div className="w-full aspect-square bg-[#0B141A] overflow-hidden border border-[#D1CBBF] relative">
                <img
                  src={selectedPatch.imageUrl}
                  alt={selectedPatch.altText}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span
                  className="absolute top-2 right-2 px-2 py-0.5 text-xs font-mono font-bold text-white shadow"
                  style={{ backgroundColor: selectedPatch.color }}
                >
                  {selectedPatch.symbol} [{selectedPatch.classType}]
                </span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-[#1D1C13]">
                  {selectedPatch.name}
                </h4>
                <p className="font-sans text-xs text-[#53606D] mt-1">{selectedPatch.altText}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#F9F3E5] p-2.5 border border-[#D1CBBF] font-mono text-xs">
                <div>
                  <span className="text-[#53606D] text-[10px] block uppercase">Confidence</span>
                  <span className="font-bold text-[#1D1C13]">{selectedPatch.confidence}</span>
                </div>
                <div>
                  <span className="text-[#53606D] text-[10px] block uppercase">Est. Coverage</span>
                  <span className="font-bold text-[#1D1C13]">{selectedPatch.areaCm2} cm²</span>
                </div>
                <div>
                  <span className="text-[#53606D] text-[10px] block uppercase">Bounding Box</span>
                  <span className="font-bold text-[#00475A]">
                    {selectedPatch.boxTargetId || 'Unmapped'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatch(null)}
                  className="px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] font-mono text-xs border border-[#D1CBBF] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPatch.boxTargetId) {
                      setActiveBoxId(selectedPatch.boxTargetId);
                      setSelectedPatch(null);
                      showToast(`Focused on ${selectedPatch.name} bounding box`);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#00475A] hover:bg-[#003543] text-white font-mono text-xs cursor-pointer"
                >
                  Locate on Quadrat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Flag for Expert Re-Annotation Modal */}
      {isFlagModalOpen && (
        <div
          id="flag-reannotation-modal"
          className="fixed inset-0 z-50 bg-[#16232E]/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsFlagModalOpen(false)}
        >
          <div
            id="flag-reannotation-dialog"
            className="w-full max-w-md bg-[#FAF8F3] border-2 border-[#16232E] shadow-[8px_8px_0px_#16232E] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#BA1A1A] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag size={15} />
                <span className="font-mono text-xs font-bold uppercase">
                  Flag for Quality Assurance Review
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFlagModalOpen(false)}
                className="text-white hover:opacity-80 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitFlag} className="p-4 flex flex-col gap-3 font-mono text-xs">
              <p className="font-sans text-xs text-[#53606D]">
                Mark photo-quadrat <strong className="text-[#1D1C13]">IMG_4018_HP_S3.JPG</strong>{' '}
                for quality assurance review of benthic health classifications.
              </p>

              <div>
                <label className="block text-[#1D1C13] font-semibold mb-1 uppercase text-[10px]">
                  Review Reason
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D1CBBF] p-2 text-xs text-[#1D1C13] focus:outline-none focus:border-[#00475A]"
                >
                  <option value="Condition classification ambiguity">
                    Condition classification ambiguity
                  </option>
                  <option value="Border misalignment">
                    Bounding box border misalignment
                  </option>
                  <option value="Health class discrepancy">
                    Health class discrepancy (LC vs PB vs DC vs DCA)
                  </option>
                  <option value="Turf algae confusion">
                    Turf algae vs substrate distinction
                  </option>
                  <option value="Other">Other protocol anomaly</option>
                </select>
              </div>

              <div>
                <label className="block text-[#1D1C13] font-semibold mb-1 uppercase text-[10px]">
                  Reviewer Notes / Annotations
                </label>
                <textarea
                  rows={3}
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  placeholder="Describe specific bounding box or colony anomaly..."
                  className="w-full bg-[#FFFFFF] border border-[#D1CBBF] p-2 font-sans text-xs text-[#1D1C13] focus:outline-none focus:border-[#00475A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E7E2D4]">
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(false)}
                  className="px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#E7E2D4] text-[#1D1C13] border border-[#D1CBBF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagSubmitted}
                  className="px-4 py-1.5 bg-[#BA1A1A] hover:bg-[#93000A] text-white font-bold cursor-pointer transition-colors"
                >
                  {flagSubmitted ? 'Submitting...' : 'Submit Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoQuadratInspectionPage;
