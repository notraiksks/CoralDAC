import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  MapPin,
  Ruler,
  CheckCircle2,
  Download,
  BarChart2,
  Columns,
  Calendar,
  Layers,
  FolderCheck,
  Microscope,
  Image as ImageIcon,
  Grid,
  ZoomIn,
  RotateCcw,
  X,
  ChevronDown,
} from 'lucide-react';
import { HP_S3_QUADRATS, StationQuadratImage } from '../data/stationAnalyticsData';
import { StationData } from '../types';

interface StationAnalyticsPageProps {
  stations?: StationData[];
  selectedStationId?: string;
  onSelectStation?: (id: string) => void;
  onNavigateToMap?: (stationId?: string) => void;
  onNavigateToUpload?: () => void;
  onNavigateToSubmissions?: () => void;
  onNavigateToCuration?: () => void;
  onInspectQuadrat?: (quadratId?: string) => void;
}

export const StationAnalyticsPage: React.FC<StationAnalyticsPageProps> = ({
  stations = [],
  selectedStationId = 'HP-S3',
  onSelectStation,
  onNavigateToMap,
  onInspectQuadrat,
}) => {
  // Sort and filter states
  const [sortOption, setSortOption] = useState<string>('id');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [gridDensity, setGridDensity] = useState<'standard' | 'compact'>('standard');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // 1:1 Inspector Modal State
  const [selectedQuadrat, setSelectedQuadrat] = useState<StationQuadratImage | null>(null);
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showPointIntercepts, setShowPointIntercepts] = useState<boolean>(true);

  // Active Station metadata
  const currentStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || {
      id: 'HP-S3',
      name: 'Harka Piloto — Shallow, T3',
      coordinates: '13.5123°N, 120.9573°E',
      transect: 'TR-03A',
      health: { lc: 67.6, pb: 18.1, dc: 10.0, dca: 4.3 },
      quadratsCount: 24,
    };
  }, [stations, selectedStationId]);

  // Filtered and Sorted Quadrats
  const filteredQuadrats = useMemo(() => {
    let result = [...HP_S3_QUADRATS];

    // Class filter
    if (classFilter === 'high_pb') {
      result = result.filter((q) => {
        const total = q.counts.lc + q.counts.pb + q.counts.dc + q.counts.dca;
        return total > 0 && (q.counts.pb / total) * 100 > 25;
      });
    } else if (classFilter === 'pure_lc') {
      result = result.filter((q) => {
        const total = q.counts.lc + q.counts.pb + q.counts.dc + q.counts.dca;
        return total > 0 && (q.counts.lc / total) * 100 >= 70;
      });
    }

    // Sort order
    if (sortOption === 'timestamp') {
      result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } else if (sortOption === 'bleach_desc') {
      result.sort((a, b) => {
        const aBleach = a.counts.pb;
        const bBleach = b.counts.pb;
        return bBleach - aBleach;
      });
    } else if (sortOption === 'colonies_desc') {
      result.sort((a, b) => {
        const aTot = a.counts.lc + a.counts.pb + a.counts.dc + a.counts.dca;
        const bTot = b.counts.lc + b.counts.pb + b.counts.dc + b.counts.dca;
        return bTot - aTot;
      });
    } else if (sortOption === 'id') {
      result.sort((a, b) => a.quadratNumber - b.quadratNumber);
    }

    return result;
  }, [classFilter, sortOption]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredQuadrats.length / pageSize));
  const paginatedQuadrats = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuadrats.slice(start, start + pageSize);
  }, [filteredQuadrats, currentPage, pageSize]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Station_ID',
      'Coordinates',
      'Transect_ID',
      'Quadrat_No',
      'Image_File',
      'Timestamp_UTC',
      'Live_Coral_Pts',
      'Partially_Bleached_Pts',
      'Dead_Coral_Pts',
      'Dead_Coral_Algae_Pts',
      'Total_Identifications',
      'Bleached_Ratio_Pct',
      'Dominant_Class',
    ];

    const rows = filteredQuadrats.map((q) => {
      const total = q.counts.lc + q.counts.pb + q.counts.dc + q.counts.dca;
      const bleachedPct = total > 0 ? ((q.counts.pb / total) * 100).toFixed(1) : '0.0';
      return [
        'HP-S3',
        '"13.5123°N, 120.9573°E"',
        'TR-03A',
        q.quadratNumber,
        q.fileName,
        `"${q.timestamp}"`,
        q.counts.lc,
        q.counts.pb,
        q.counts.dc,
        q.counts.dca,
        total,
        `${bleachedPct}%`,
        q.dominantClass,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `station_${currentStation.id}_TR-03A_quadrat_census.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="station-analytics-page" className="w-full min-h-screen bg-[#E7E2D4] pb-20">
      {/* 1. Top Navigation & Station Bar */}
      <div className="bg-[#FFFFFF] p-3.5 md:p-4 shadow-sm border-b border-[#D1CBBF] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#53606D] font-mono text-[10px] uppercase tracking-wider">
            <button
              id="btn-back-to-map"
              type="button"
              onClick={() => onNavigateToMap && onNavigateToMap(currentStation.id)}
              className="inline-flex items-center gap-1 text-[#1E5F74] hover:text-[#00475A] transition-colors font-mono text-[11px] font-semibold cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to map</span>
            </button>
            <span className="text-[#C0C8CC]">/</span>
            <span>Western Pacific Archival Basin</span>
            <span className="text-[#C0C8CC]">/</span>
            <span className="text-[#1D1C13] font-semibold">Node 08-HP</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-serif text-xl md:text-2xl font-bold text-[#1D1C13]">
              Station: {currentStation.name || 'Harka Piloto — Shallow, T3'}
            </h1>
            <div className="flex items-center gap-1 font-mono text-[11px] bg-[#E7E2D4]/50 px-2 py-0.5 text-[#40484C] border border-[#D1CBBF]">
              <MapPin size={13} className="text-[#00475A]" />
              <span className="font-semibold text-[#1D1C13]">{currentStation.coordinates}</span>
            </div>

            {/* Quick Station Switcher */}
            {stations.length > 1 && onSelectStation && (
              <div className="relative inline-block ml-2">
                <select
                  id="station-picker-dropdown"
                  value={selectedStationId}
                  onChange={(e) => onSelectStation(e.target.value)}
                  aria-label="Select Survey Station"
                  className="bg-[#FAF8F3] border border-[#C0C8CC] text-[10px] font-mono py-0.5 px-2 pr-5 text-[#1D1C13] focus:outline-none focus:border-[#1E5F74] cursor-pointer"
                >
                  <option value="HP-S3">HP-S3 (Harka Piloto)</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-1 top-1.5 text-[#53606D] pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Survey Verification & Action */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#F9F3E5] text-[#1D1C13] border border-[#D1CBBF]">
            <Ruler size={14} className="text-[#1E5F74]" />
            <span className="text-[#53606D]">TRANSECT:</span>
            <span className="font-semibold font-mono text-[11px]">{currentStation.transect || 'TR-03A'}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#505E21]/15 text-[#39460B] font-mono text-[11px] font-semibold border border-[#505E21]/30">
            <CheckCircle2 size={14} />
            <span>QA VERIFIED</span>
          </div>

          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1 bg-[#00475A] text-white font-mono text-[10px] uppercase tracking-wide hover:bg-[#003543] transition-colors shadow-sm cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Analytic Stratum: Side-by-Side Diagnostic Ledgers */}
      <div className="p-3.5 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Stat Panel: Total Counts & Class Breakdown */}
        <div className="lg:col-span-6 bg-[#FFFFFF] p-3.5 md:p-4 shadow-sm border border-[#D1CBBF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2D4]">
              <div className="flex items-center gap-2">
                <BarChart2 size={17} className="text-[#1E5F74]" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#53606D] font-semibold">
                  Benthic Census Ledger // Point-Intercept Counts
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#70787C]">N = 210 IDENTIFICATIONS</span>
            </div>

            {/* Metric Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5">
              {/* Living Coral */}
              <div className="flex flex-col bg-[#F9F3E5]/70 p-2.5 border border-[#D1CBBF]/60">
                <div className="flex items-center justify-between text-[#53606D]">
                  <span className="font-mono text-[10px] font-semibold flex items-center gap-1 text-[#F2637A]">
                    <span className="text-[10px]">●</span> [LC]
                  </span>
                  <span className="font-mono text-[9px] uppercase">Live</span>
                </div>
                <div className="font-serif text-xl font-bold text-[#1D1C13] mt-1">142</div>
                <span className="font-mono text-[10px] text-[#53606D]">Colonies</span>
              </div>

              {/* Partially Bleached */}
              <div className="flex flex-col bg-[#F9F3E5]/70 p-2.5 border border-[#D1CBBF]/60">
                <div className="flex items-center justify-between text-[#53606D]">
                  <span className="font-mono text-[10px] font-semibold flex items-center gap-1 text-[#E8A93C]">
                    <span className="text-[10px]">▲</span> [PB]
                  </span>
                  <span className="font-mono text-[9px] uppercase">Stress</span>
                </div>
                <div className="font-serif text-xl font-bold text-[#1D1C13] mt-1">38</div>
                <span className="font-mono text-[10px] text-[#53606D]">Colonies</span>
              </div>

              {/* Dead Coral */}
              <div className="flex flex-col bg-[#F9F3E5]/70 p-2.5 border border-[#D1CBBF]/60">
                <div className="flex items-center justify-between text-[#53606D]">
                  <span className="font-mono text-[10px] font-semibold flex items-center gap-1 text-[#8B8378]">
                    <span className="text-[10px]">■</span> [DC]
                  </span>
                  <span className="font-mono text-[9px] uppercase">Mortal</span>
                </div>
                <div className="font-serif text-xl font-bold text-[#1D1C13] mt-1">21</div>
                <span className="font-mono text-[10px] text-[#53606D]">Colonies</span>
              </div>

              {/* Dead Coral + Turf Algae */}
              <div className="flex flex-col bg-[#F9F3E5]/70 p-2.5 border border-[#D1CBBF]/60">
                <div className="flex items-center justify-between text-[#53606D]">
                  <span className="font-mono text-[10px] font-semibold flex items-center gap-1 text-[#6B7A3A]">
                    <span className="text-[10px]">◆</span> [DCA]
                  </span>
                  <span className="font-mono text-[9px] uppercase">Algal</span>
                </div>
                <div className="font-serif text-xl font-bold text-[#1D1C13] mt-1">9</div>
                <span className="font-mono text-[10px] text-[#53606D]">Colonies</span>
              </div>
            </div>
          </div>

          {/* Ratio Footers */}
          <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t border-[#E7E2D4] gap-2 font-mono text-[11px]">
            <div className="flex items-baseline gap-2">
              <span className="text-[#53606D] uppercase">Bleaching Ratio:</span>
              <span className="font-serif text-lg text-[#E8A93C] font-bold">18.1%</span>
              <span className="font-mono text-[10px] text-[#53606D]">(38 / 210 points)</span>
            </div>
            <div className="flex items-baseline gap-2 text-[#1D1C13]">
              <span className="text-[#53606D] uppercase">Total Census:</span>
              <span className="font-mono text-xs font-bold">210 Points</span>
            </div>
          </div>
        </div>

        {/* Right Stat Panel: Class Distribution & Benthic Proportions */}
        <div className="lg:col-span-6 bg-[#FFFFFF] p-3.5 md:p-4 shadow-sm border border-[#D1CBBF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2D4]">
              <div className="flex items-center gap-2">
                <Columns size={17} className="text-[#1E5F74]" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#53606D] font-semibold">
                  Benthic Composition // Proportional Allocation
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#70787C]">CLASS STACK %</span>
            </div>

            {/* Proportional Stack Bar */}
            <div className="mt-3 flex flex-col gap-1">
              <div className="w-full h-8 flex overflow-hidden shadow-inner text-white font-mono text-[10px] font-semibold select-none border border-[#D1CBBF]">
                <div
                  className="bg-[#F2637A] h-full flex items-center justify-center px-1 truncate"
                  style={{ width: '67.6%' }}
                  title="Living Coral: 67.6%"
                >
                  LC 67.6%
                </div>
                <div
                  className="bg-[#E8A93C] h-full flex items-center justify-center px-1 text-[#1D1C13] truncate font-bold"
                  style={{ width: '18.1%' }}
                  title="Partially Bleached: 18.1%"
                >
                  PB 18.1%
                </div>
                <div
                  className="bg-[#8B8378] h-full flex items-center justify-center px-1 truncate"
                  style={{ width: '10.0%' }}
                  title="Dead Coral: 10.0%"
                >
                  DC 10%
                </div>
                <div
                  className="bg-[#6B7A3A] h-full flex items-center justify-center px-1 truncate"
                  style={{ width: '4.3%' }}
                  title="Dead Coral + Algae: 4.3%"
                >
                  4%
                </div>
              </div>

              <div className="flex justify-between items-center text-[#53606D] font-mono text-[9px] px-0.5">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Benthic Ecological Breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-1">
              <div className="flex flex-col bg-[#F9F3E5] p-2 border border-[#D1CBBF]/60">
                <span className="font-mono text-[9px] uppercase text-[#53606D]">Live Coral Cover</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-serif text-base font-bold text-[#F2637A]">67.6%</span>
                </div>
                <span className="font-mono text-[9px] text-[#53606D] mt-0.5">142 of 210 points</span>
              </div>

              <div className="flex flex-col bg-[#F9F3E5] p-2 border border-[#D1CBBF]/60">
                <span className="font-mono text-[9px] uppercase text-[#53606D]">Bleaching Ratio</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-serif text-base font-bold text-[#E8A93C]">18.1%</span>
                </div>
                <span className="font-mono text-[9px] text-[#53606D] mt-0.5">38 stressed points</span>
              </div>

              <div className="flex flex-col bg-[#F9F3E5] p-2 border border-[#D1CBBF]/60">
                <span className="font-mono text-[9px] uppercase text-[#53606D]">Total Mortality</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-serif text-base font-bold text-[#8B8378]">14.3%</span>
                </div>
                <span className="font-mono text-[9px] text-[#53606D] mt-0.5">DC + DCA points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Station Metadata Row */}
      <div className="px-3.5 md:px-4 mb-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-[#FFFFFF] p-3 md:p-4 shadow-sm border border-[#D1CBBF]">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center bg-[#F9F3E5] text-[#00475A] border border-[#D1CBBF] flex-shrink-0">
              <Calendar size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase text-[#53606D]">Survey Period</span>
              <span className="font-mono text-[11px] font-semibold text-[#1D1C13] mt-0.5">
                Feb 14 – Mar 06, 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section Header & Filter Utility Bar */}
      <div className="px-3.5 md:px-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2 mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-[#1E5F74]" />
            <h2 className="font-serif text-lg font-bold text-[#1D1C13]">Approved images at this station</h2>
            <span className="font-mono text-[10px] bg-[#E7E2D4] px-2 py-0.5 text-[#40484C] font-semibold border border-[#D1CBBF]">
              {filteredQuadrats.length} PHOTO-QUADRATS
            </span>
          </div>
        </div>

        {/* Filters / Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#FFFFFF] px-2.5 py-1 border border-[#D1CBBF] shadow-sm">
            <span className="font-mono text-[10px] uppercase text-[#53606D] mr-2">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sort photo-quadrats"
              className="bg-transparent font-mono text-[10px] text-[#1D1C13] focus:outline-none cursor-pointer"
            >
              <option value="id">Transect position (Seq)</option>
              <option value="timestamp">Date captured (Ascending)</option>
              <option value="bleach_desc">Bleaching severity (High to Low)</option>
              <option value="colonies_desc">Colony count (High to Low)</option>
            </select>
          </div>

          <div className="flex items-center bg-[#FFFFFF] px-2.5 py-1 border border-[#D1CBBF] shadow-sm">
            <span className="font-mono text-[10px] uppercase text-[#53606D] mr-2">Class Filter:</span>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by coral class"
              className="bg-transparent font-mono text-[10px] text-[#1D1C13] focus:outline-none cursor-pointer"
            >
              <option value="all">All Classes (LC, PB, DC, DCA)</option>
              <option value="high_pb">High Bleaching (PB &gt; 25%)</option>
              <option value="pure_lc">Dominated Live Coral (LC &ge; 70%)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setGridDensity((d) => (d === 'standard' ? 'compact' : 'standard'))}
            className={`flex items-center justify-center p-1.5 border border-[#D1CBBF] shadow-sm transition-colors cursor-pointer ${
              gridDensity === 'compact' ? 'bg-[#1E5F74] text-white' : 'bg-[#FFFFFF] text-[#53606D] hover:bg-[#E7E2D4]'
            }`}
            title="Toggle Grid Density"
          >
            <Grid size={15} />
          </button>
        </div>
      </div>

      {/* 5. Photo-Quadrat Responsive Grid */}
      <div className="px-3.5 md:px-4">
        <div
          className={`grid gap-3.5 ${
            gridDensity === 'standard'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
          }`}
        >
          {paginatedQuadrats.map((q) => (
            <div
              key={q.id}
              id={`quadrat-card-${q.id.toLowerCase()}`}
              className="group flex flex-col bg-[#FFFFFF] border border-[#D1CBBF] shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Image Viewport */}
              <div
                className="relative w-full aspect-square overflow-hidden bg-[#0D1821] cursor-pointer"
                onClick={() => {
                  if (onInspectQuadrat) {
                    onInspectQuadrat(q.id);
                  } else {
                    setSelectedQuadrat(q);
                    setModalZoom(1);
                  }
                }}
              >
                <img
                  src={q.imageUrl}
                  alt={q.altText}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Quadrat Badge */}
                <div className="absolute top-2 left-2 bg-[#16232E]/85 text-[#FAF8F3] font-mono text-[9px] px-1.5 py-0.5 tracking-wider border border-[#16232E]">
                  Quadrat #{String(q.quadratNumber).padStart(2, '0')}
                </div>

                {/* Dominant Class Dot */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-sm"
                    style={{ backgroundColor: q.dominantColor }}
                    title={`Dominant class: ${q.dominantClass}`}
                  />
                </div>

                {/* Crosshair Inspection Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#00475A]/25 backdrop-blur-[1px] transition-opacity">
                  <span className="font-mono text-[10px] uppercase bg-[#FAF8F3] text-[#1E5F74] px-2 py-1 font-bold shadow-md border border-[#16232E] flex items-center gap-1">
                    <ZoomIn size={12} />
                    Inspect Image →
                  </span>
                </div>
              </div>

              {/* Card Meta & Breakdown */}
              <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold text-[#1D1C13] truncate" title={q.fileName}>
                      {q.fileName}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[#53606D] block mt-0.5">{q.timestamp}</span>
                </div>

                <div className="pt-1.5 border-t border-[#E7E2D4] font-mono text-[9px] flex items-center justify-between text-[#53606D]">
                  <span className="truncate">
                    <span className="text-[#F2637A] font-semibold">LC:{q.counts.lc}</span> ·{' '}
                    <span className="text-[#E8A93C] font-semibold">PB:{q.counts.pb}</span> ·{' '}
                    <span className="text-[#8B8378]">DC:{q.counts.dc}</span> ·{' '}
                    <span className="text-[#6B7A3A]">DCA:{q.counts.dca}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Pagination / Load Range Ledger Control */}
      <div className="mx-3.5 md:mx-4 mt-3.5 flex flex-col sm:flex-row items-center justify-between bg-[#FFFFFF] p-2.5 px-4 shadow-sm border border-[#D1CBBF] gap-2 font-mono text-[10px]">
        <div className="text-[#53606D]">
          Showing <span className="font-semibold text-[#1D1C13]">{filteredQuadrats.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredQuadrats.length)}</span> of{' '}
          <span className="font-semibold text-[#1D1C13]">{filteredQuadrats.length}</span> verified photo-quadrats across Transect {currentStation.transect || 'TR-03A'}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-2.5 py-1 border border-[#D1CBBF] uppercase ${
              currentPage === 1
                ? 'bg-[#F9F3E5] text-[#70787C] cursor-not-allowed opacity-60'
                : 'bg-[#FAF8F3] text-[#1D1C13] hover:bg-[#E7E2D4] cursor-pointer'
            }`}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`px-2 py-1 font-semibold border ${
                  currentPage === pageNum
                    ? 'bg-[#00475A] text-white border-[#00475A]'
                    : 'bg-[#FAF8F3] text-[#1D1C13] border-[#D1CBBF] hover:bg-[#E7E2D4] cursor-pointer'
                }`}
              >
                {String(pageNum).padStart(2, '0')}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-2.5 py-1 border border-[#D1CBBF] uppercase font-semibold ${
              currentPage === totalPages
                ? 'bg-[#F9F3E5] text-[#70787C] cursor-not-allowed opacity-60'
                : 'bg-[#FAF8F3] text-[#00475A] hover:bg-[#E7E2D4] cursor-pointer'
            }`}
          >
            Next Page →
          </button>
        </div>
      </div>

      {/* 7. Interactive 1:1 Image Inspector Modal */}
      {selectedQuadrat && (
        <div
          id="quadrat-inspection-modal"
          className="fixed inset-0 z-50 bg-[#16232E]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedQuadrat(null)}
        >
          <div
            id="quadrat-inspection-dialog"
            className="w-full max-w-5xl max-h-[92vh] bg-[#FAF8F3] border-2 border-[#16232E] shadow-[8px_8px_0px_#16232E] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#00475A] text-white px-4 py-2.5 border-b border-[#16232E] flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-mono text-xs text-[#9CD7EF] uppercase tracking-wider font-semibold">
                  HIGH-RESOLUTION 1:1 INSPECTOR //
                </span>
                <span className="font-serif text-sm font-bold">
                  {selectedQuadrat.fileName} (Quadrat #{String(selectedQuadrat.quadratNumber).padStart(2, '0')})
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPointIntercepts((prev) => !prev)}
                  className={`px-2 py-1 font-mono text-[10px] border cursor-pointer ${
                    showPointIntercepts
                      ? 'bg-[#1E5F74] text-white border-[#9CD7EF]'
                      : 'bg-transparent text-[#BAC8D7] border-[#BAC8D7]/40'
                  }`}
                >
                  POINTS [{showPointIntercepts ? 'ON' : 'OFF'}]
                </button>

                <button
                  type="button"
                  onClick={() => setShowGridOverlay((prev) => !prev)}
                  className={`px-2 py-1 font-mono text-[10px] border cursor-pointer ${
                    showGridOverlay
                      ? 'bg-[#1E5F74] text-white border-[#9CD7EF]'
                      : 'bg-transparent text-[#BAC8D7] border-[#BAC8D7]/40'
                  }`}
                >
                  GRID [{showGridOverlay ? 'ON' : 'OFF'}]
                </button>

                <div className="h-4 w-[1px] bg-[#3B4854]" />

                <button
                  type="button"
                  onClick={() => setModalZoom((z) => Math.max(0.75, z - 0.25))}
                  className="px-2 py-0.5 bg-[#16232E] text-white font-mono text-xs hover:bg-[#20303E] cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-xs px-1 text-[#9CD7EF]">
                  {Math.round(modalZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setModalZoom((z) => Math.min(2.5, z + 0.25))}
                  className="px-2 py-0.5 bg-[#16232E] text-white font-mono text-xs hover:bg-[#20303E] cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setModalZoom(1)}
                  className="px-2 py-0.5 bg-[#16232E] text-white font-mono text-xs hover:bg-[#20303E] cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw size={12} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedQuadrat(null)}
                  className="p-1 hover:bg-[#BA1A1A] text-white transition-colors ml-2 cursor-pointer"
                  aria-label="Close Inspector"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Image Stage */}
            <div className="flex-1 bg-[#0D1821] overflow-auto flex items-center justify-center p-4 relative min-h-[420px]">
              <div
                style={{ transform: `scale(${modalZoom})`, transformOrigin: 'center' }}
                className="relative transition-transform duration-150 shadow-2xl border border-[#243442]"
              >
                <img
                  src={selectedQuadrat.imageUrl}
                  alt={selectedQuadrat.altText}
                  referrerPolicy="no-referrer"
                  className="max-h-[65vh] max-w-[80vw] object-contain select-none"
                />

                {/* 10x10 Orthogonal Calibration Grid */}
                {showGridOverlay && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-10 grid-rows-10">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div
                        key={i}
                        className="border border-white/15 flex items-start justify-start p-0.5"
                      >
                        <span className="text-[7px] font-mono text-white/40">
                          {String.fromCharCode(65 + Math.floor(i / 10))}
                          {(i % 10) + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Point Intercept Crosshairs */}
                {showPointIntercepts &&
                  selectedQuadrat.interceptPoints.map((pt) => {
                    const colorMap = {
                      LC: '#F2637A',
                      PB: '#E8A93C',
                      DC: '#8B8378',
                      DCA: '#6B7A3A',
                    };
                    const color = colorMap[pt.classType] || '#F2637A';
                    return (
                      <div
                        key={pt.id}
                        style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      >
                        <div
                          style={{ borderColor: color }}
                          className="w-4 h-4 border-2 rounded-full relative flex items-center justify-center animate-pulse"
                        >
                          <div
                            style={{ backgroundColor: color }}
                            className="w-1.5 h-1.5 rounded-full"
                          />
                        </div>
                        <div
                          style={{ backgroundColor: color }}
                          className="absolute left-5 top-0 text-white font-mono text-[9px] px-1.5 py-0.5 shadow-md whitespace-nowrap leading-none border border-black/30 font-semibold"
                        >
                          {pt.label} ({pt.confidence})
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer / Survey Metadata */}
            <div className="bg-[#FAF8F3] px-4 py-2.5 border-t border-[#D1CBBF] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-[#40484C]">
                  Station {currentStation.id} {'//'} Transect {currentStation.transect || 'TR-03A'}
                </span>
                <span className="text-[#70787C]">|</span>
                <span className="text-[#1D1C13]">
                  Captured: {selectedQuadrat.timestamp}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-[#FFFFFF] px-2 py-1 border border-[#D1CBBF] text-[10px]">
                  <span className="text-[#F2637A] font-bold">LC: {selectedQuadrat.counts.lc}</span>
                  <span className="text-[#E8A93C] font-bold">PB: {selectedQuadrat.counts.pb}</span>
                  <span className="text-[#8B8378] font-bold">DC: {selectedQuadrat.counts.dc}</span>
                  <span className="text-[#6B7A3A] font-bold">DCA: {selectedQuadrat.counts.dca}</span>
                </div>
                {onInspectQuadrat && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedQuadrat.id;
                      setSelectedQuadrat(null);
                      onInspectQuadrat(id);
                    }}
                    className="px-3 py-1 bg-[#00475A] text-white font-mono text-[11px] uppercase hover:bg-[#003543] cursor-pointer font-semibold flex items-center gap-1"
                  >
                    <span>Full 1m² Workstation →</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedQuadrat(null)}
                  className="px-3 py-1 bg-[#1E5F74] text-white font-mono text-[11px] uppercase hover:bg-[#00475A] cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
