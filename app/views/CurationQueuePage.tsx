import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  ZoomIn,
  ChevronDown,
  Touchpad,
  CheckCheck,
  X,
  RotateCcw,
} from 'lucide-react';
import { CurationRecord } from '../types/curation';
import { INITIAL_CURATION_QUEUE } from '../data/curationQueueData';

interface CurationQueuePageProps {
  onNavigateToMap?: (stationId?: string) => void;
  onNavigateToSubmissions?: () => void;
  onNavigateToUpload?: () => void;
}

export const CurationQueuePage: React.FC<CurationQueuePageProps> = () => {
  const [queue, setQueue] = useState<CurationRecord[]>(INITIAL_CURATION_QUEUE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(['B2026-089', 'B2026-088'])
  );

  // Filters
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [temporalFilter, setTemporalFilter] = useState<string>('14D');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('0.80');
  const [sortOrder, setSortOrder] = useState<string>('FIFO');

  // UI States
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);

  // 1:1 Expand Modal
  const [expandedRecord, setExpandedRecord] = useState<CurationRecord | null>(null);
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [showModalBoxes, setShowModalBoxes] = useState<boolean>(true);
  const [showModalGrid, setShowModalGrid] = useState<boolean>(true);

  // Filtered & Sorted items
  const filteredQueue = useMemo(() => {
    return queue
      .map((item) => ({
        item,
        timestamp: Date.parse(item.timestamp),
      }))
      .filter((item) => {
        if (item.item.status !== 'pending') return false;

        if (stationFilter !== 'ALL' && item.item.stationId !== stationFilter) {
          return false;
        }

        if (confidenceFilter === '0.80' && item.item.meanConfidence < 80) return false;
        if (confidenceFilter === '0.90' && item.item.meanConfidence < 90) return false;
        if (confidenceFilter === '0.70' && item.item.meanConfidence < 70) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'FIFO') {
          return a.timestamp - b.timestamp;
        }
        if (sortOrder === 'NEWEST') {
          return b.timestamp - a.timestamp;
        }
        if (sortOrder === 'LOW_CONF') {
          return a.item.meanConfidence - b.item.meanConfidence;
        }
        if (sortOrder === 'BLEACH_HIGH') {
          return b.item.proportions.pb - a.item.proportions.pb;
        }
        return 0;
      })
      .map(({ item }) => item);
  }, [queue, stationFilter, confidenceFilter, sortOrder]);

  const pendingCount = useMemo(() => {
    return queue.filter((q) => q.status === 'pending').length;
  }, [queue]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.size === filteredQueue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQueue.map((item) => item.id)));
    }
  };

  // Approval & Rejection
  const handleApprove = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'rejected' } : item
      )
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    setQueue((prev) =>
      prev.map((item) => (selectedIds.has(item.id) ? { ...item, status: 'approved' } : item))
    );
    setSelectedIds(new Set());
  };

  const handleBatchReject = () => {
    if (selectedIds.size === 0) return;
    setQueue((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id)
          ? { ...item, status: 'rejected' }
          : item
      )
    );
    setSelectedIds(new Set());
  };

  // Hotkeys
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (filteredQueue.length === 0) return;

      if (e.key === 'j' || e.key === 'J') {
        setActiveCardIndex((idx) => Math.min(filteredQueue.length - 1, idx + 1));
      } else if (e.key === 'k' || e.key === 'K') {
        setActiveCardIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === 'a' || e.key === 'A') {
        const current = filteredQueue[activeCardIndex];
        if (current) {
          handleApprove(current.id);
        }
      }
    },
    [filteredQueue, activeCardIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div id="curation-queue-page" className="flex flex-col w-full min-h-screen bg-[#E7E2D4] pt-14 pb-32">
      {/* 1. Curation Control & Filters Header */}
      <div
        id="curation-header-bar"
        className="px-5 py-3.5 bg-[#F9F3E5] border-b border-[#D1CBBF] shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Subtitle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#1D1C13] tracking-tight">
                Curation Queue
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#E8A93C]/20 border border-[#E8A93C]/40 text-[#8A5B00]">
                <span className="inline-block w-2 h-2 bg-[#E8A93C]" />
                <span className="font-mono text-xs uppercase font-semibold tracking-wider">
                  {pendingCount} Pending Review
                </span>
              </div>
              <span className="hidden md:inline font-mono text-xs text-[#70787C]">|</span>
              <span className="font-mono text-xs text-[#40484C] uppercase tracking-widest">
                Review Gate
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#70787C] uppercase tracking-wider">
              ADMINISTRATIVE REVIEW GATE // BENTHIC DATASET INGESTION &amp; CORAL HEALTH VALIDATION
            </p>
          </div>

          {/* Station / Confidence Filter Tools */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {/* Station Dropdown */}
            <div className="flex w-[150px] min-w-0 flex-col">
              <label
                htmlFor="filter-station-sector"
                className="font-mono text-[9px] uppercase tracking-wider text-[#70787C] mb-0.5"
              >
                Station Sector
              </label>
              <div className="relative bg-[#FFFFFF] border border-[#70787C]/30 px-2 py-1 shadow-sm">
                <select
                  id="filter-station-sector"
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="w-full min-w-0 font-mono text-[11px] text-[#1D1C13] bg-transparent pr-6 focus:outline-none cursor-pointer uppercase"
                >
                  <option value="ALL">All Stations ({pendingCount})</option>
                  <option value="HP-S3">HP-S3 (Outer Ribbon)</option>
                  <option value="BAKER-04">Baker-04 (Apex Crest)</option>
                  <option value="HASTINGS-07">Hastings-07 (Outer Wall)</option>
                  <option value="PELORUS-12">Pelorus-South-12</option>
                </select>
                <ChevronDown
                  className="absolute right-1.5 top-1.5 text-[#70787C] pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex w-[135px] min-w-0 flex-col">
              <label
                htmlFor="filter-temporal-range"
                className="font-mono text-[9px] uppercase tracking-wider text-[#70787C] mb-0.5"
              >
                Temporal Range
              </label>
              <div className="relative bg-[#FFFFFF] border border-[#70787C]/30 px-2 py-1 shadow-sm">
                <select
                  id="filter-temporal-range"
                  value={temporalFilter}
                  onChange={(e) => setTemporalFilter(e.target.value)}
                  className="w-full min-w-0 font-mono text-[11px] text-[#1D1C13] bg-transparent pr-6 focus:outline-none cursor-pointer uppercase"
                >
                  <option value="14D">Past 14 Days</option>
                  <option value="48H">Past 48 Hours</option>
                  <option value="30D">Past 30 Days</option>
                  <option value="Q1">Season Q1-2026</option>
                </select>
                <ChevronDown
                  className="absolute right-1.5 top-1.5 text-[#70787C] pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            {/* Min Confidence */}
            <div className="flex w-[145px] min-w-0 flex-col">
              <label
                htmlFor="filter-confidence"
                className="font-mono text-[9px] uppercase tracking-wider text-[#70787C] mb-0.5"
              >
                Model Confidence
              </label>
              <div className="relative bg-[#FFFFFF] border border-[#70787C]/30 px-2 py-1 shadow-sm">
                <select
                  id="filter-confidence"
                  value={confidenceFilter}
                  onChange={(e) => setConfidenceFilter(e.target.value)}
                  className="w-full min-w-0 font-mono text-[11px] text-[#1D1C13] bg-transparent pr-6 focus:outline-none cursor-pointer uppercase"
                >
                  <option value="0.80">≥ 0.80 Conf</option>
                  <option value="0.90">≥ 0.90 Precision</option>
                  <option value="0.70">≥ 0.70 Low-Cutoff</option>
                  <option value="ALL">All Inference</option>
                </select>
                <ChevronDown
                  className="absolute right-1.5 top-1.5 text-[#70787C] pointer-events-none"
                  size={14}
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="flex w-[165px] min-w-0 flex-col">
              <label
                htmlFor="filter-sort-order"
                className="font-mono text-[9px] uppercase tracking-wider text-[#70787C] mb-0.5"
              >
                Ingest Order
              </label>
              <div className="relative bg-[#FFFFFF] border border-[#70787C]/30 px-2 py-1 shadow-sm">
                <select
                  id="filter-sort-order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full min-w-0 font-mono text-[11px] text-[#1D1C13] bg-transparent pr-6 focus:outline-none cursor-pointer uppercase"
                >
                  <option value="FIFO">Oldest First (FIFO)</option>
                  <option value="NEWEST">Newest Ingest</option>
                  <option value="LOW_CONF">Lowest Confidence</option>
                  <option value="BLEACH_HIGH">Bleached Proportion High</option>
                </select>
                <ChevronDown
                  className="absolute right-1.5 top-1.5 text-[#70787C] pointer-events-none"
                  size={14}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Guidance Bar */}
        <div className="mt-2.5 pt-2 border-t border-[#D1CBBF]/60 flex items-center justify-between text-[#40484C] font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <Touchpad size={15} className="text-[#00475A]" />
            <span>
              Batch Mode Active: Select item checkboxes to stage multiple transects for synchronous review commits.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[10px] text-[#70787C]">
            <span>HOTKEYS: [A] Approve · [R] Flag Reject · [J/K] Next/Prev Card</span>
          </div>
        </div>
      </div>

      {/* 2. Main Curation Stream Cards */}
      <div className="px-5 py-4 flex flex-col gap-5">
        {filteredQueue.length === 0 ? (
          <div className="bg-[#FAF8F3] border border-[#16232E]/20 p-8 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle className="text-[#39460B]" size={36} />
            <h3 className="font-serif text-lg font-bold text-[#1D1C13]">
              Queue Clear // All Items Curated
            </h3>
            <p className="font-sans text-xs text-[#53606D] max-w-md">
              No pending survey records match your active sector or confidence filters.
            </p>
            <button
              onClick={() => {
                setStationFilter('ALL');
                setConfidenceFilter('0.80');
              }}
              className="mt-2 px-3 py-1.5 bg-[#1E5F74] text-white font-mono text-xs uppercase"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredQueue.map((record, index) => {
            const isSelected = selectedIds.has(record.id);
            const isActive = index === activeCardIndex;
            return (
              <article
                key={record.id}
                id={`card-${record.id.toLowerCase()}`}
                onClick={() => setActiveCardIndex(index)}
                className={`bg-[#FFFFFF] border transition-all shadow-sm ${
                  isActive
                    ? 'border-[#1E5F74] ring-1 ring-[#1E5F74]'
                    : 'border-[#16232E]/20 hover:border-[#16232E]/40'
                }`}
              >
                {/* Archival Header Strip */}
                <div className="bg-[#F9F3E5] px-4 py-2.5 border-b border-[#D1CBBF] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(record.id)}
                        className="w-4 h-4 text-[#00475A] rounded-none focus:ring-0 cursor-pointer accent-[#1E5F74]"
                      />
                      <span className="font-mono text-xs font-bold text-[#1D1C13] tracking-wide">
                        {record.submissionNumber}
                      </span>
                    </label>
                    <span className="text-[#70787C]">•</span>
                    <span className="font-mono text-[11px] text-[#40484C]">
                      Ingest: {record.uploadedDate}
                    </span>
                    <span className="text-[#70787C]">•</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#D3E1F0] text-[#576471] border border-[#C0C8CC]/60">
                      {record.stationName} ({record.stationSector} · Station Depth: {record.nominalDepth})
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#00475A] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#E8A93C] inline-block" />
                      Pending Curation
                    </span>
                  </div>
                </div>

                {/* Card Core: 3-Column Inspection Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-[#D1CBBF]">
                  {/* Column 1: Annotated Quadrat Image (5 cols) */}
                  <div className="lg:col-span-5 p-3.5 bg-[#FFFFFF] border-r border-[#D1CBBF] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#40484C] font-semibold">
                          1.0m² Photo-Quadrat // ML Bounding Grid
                        </span>
                        <button
                          id={`btn-expand-${record.id.toLowerCase()}`}
                          type="button"
                          onClick={() => {
                            setExpandedRecord(record);
                            setModalZoom(1);
                          }}
                          className="flex items-center gap-1 text-[#00475A] hover:text-[#1E5F74] font-mono text-[10px] tracking-wide cursor-pointer"
                        >
                          <ZoomIn size={13} />
                          <span>EXPAND 1:1</span>
                        </button>
                      </div>

                      {/* Annotated Viewport with Bounding Boxes */}
                      <div className="relative w-full h-72 bg-[#0D1821] overflow-hidden group border border-[#16232E]/30 select-none">
                        <img
                          src={record.quadratImg}
                          alt={record.altText}
                          className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Overlays / Bounding Boxes */}
                        <div className="absolute inset-0 pointer-events-none p-3">
                          {record.boundingBoxes.map((bb) => (
                            <div
                              key={bb.id}
                              style={{
                                top: bb.top,
                                left: bb.left,
                                width: bb.width,
                                height: bb.height,
                                borderColor: bb.bgColor,
                              }}
                              className="absolute border-2 shadow-sm pointer-events-auto"
                            >
                              <div
                                style={{ backgroundColor: bb.bgColor, color: bb.textColor }}
                                className="absolute -top-4 left-0 font-mono text-[9px] px-1 py-0.5 flex items-center gap-1 leading-none shadow-sm whitespace-nowrap"
                              >
                                <span>{bb.label}</span>
                                <span className="font-bold">{bb.confidence} Conf</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* HUD Bottom Bar Inside Image */}
                        <div className="absolute bottom-0 inset-x-0 bg-[#16232E]/85 backdrop-blur-sm px-2.5 py-1 flex items-center justify-between text-white font-mono text-[10px] border-t border-[#16232E]">
                          <span>
                            {record.hudFov} · {record.hudScale}
                          </span>
                          <span className="text-[#D6E4F3] font-semibold">{record.hudStation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Defined 4-Class Health Legend */}
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 bg-[#F2637A]/15 text-[#9C2036] font-semibold border border-[#F2637A]/30">
                        ■ [LC] Live Coral
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#E8A93C]/20 text-[#8A5B00] font-semibold border border-[#E8A93C]/40">
                        ◇ [PB] Pale / Bleached
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#8B8378]/20 text-[#4D4842] font-semibold border border-[#8B8378]/40">
                        ✕ [DC] Dead Coral
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#6B7A3A]/20 text-[#3F4A1E] font-semibold border border-[#6B7A3A]/40">
                        ▤ [DCA] Dead Coral with Algae
                      </span>
                    </div>
                  </div>

                  {/* Column 2: 4-Class Breakdown & ML Telemetry (4 cols) */}
                  <div className="lg:col-span-4 p-3.5 bg-[#F9F3E5] border-r border-[#D1CBBF] flex flex-col justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#40484C] font-semibold">
                          Benthic Coverage Proportions
                        </span>
                        <span className="font-mono text-[10px] text-[#70787C]">
                          N={record.nodesCount} NODES
                        </span>
                      </div>

                      {/* Stacked Coverage Bar */}
                      <div className="w-full h-5 bg-[#E7E2D4] flex overflow-hidden border border-[#D1CBBF] shadow-inner">
                        <div
                          className="h-full bg-[#F2637A] hover:opacity-90 transition-opacity"
                          style={{ width: `${record.proportions.lc}%` }}
                          title={`Living Coral (LC): ${record.proportions.lc}%`}
                        />
                        <div
                          className="h-full bg-[#E8A93C] hover:opacity-90 transition-opacity"
                          style={{ width: `${record.proportions.pb}%` }}
                          title={`Partially Bleached (PB): ${record.proportions.pb}%`}
                        />
                        <div
                          className="h-full bg-[#8B8378] hover:opacity-90 transition-opacity"
                          style={{ width: `${record.proportions.dc}%` }}
                          title={`Dead Coral (DC): ${record.proportions.dc}%`}
                        />
                        <div
                          className="h-full bg-[#6B7A3A] hover:opacity-90 transition-opacity"
                          style={{ width: `${record.proportions.dca}%` }}
                          title={`Dead Coral Algae (DCA): ${record.proportions.dca}%`}
                        />
                        {record.proportions.substrate > 0 && (
                          <div
                            className="h-full bg-[#D1CBBF] hover:opacity-90 transition-opacity"
                            style={{ width: `${record.proportions.substrate}%` }}
                            title={`Substrate: ${record.proportions.substrate}%`}
                          />
                        )}
                      </div>

                      {/* Breakdown Ledger Table */}
                      <div className="bg-[#FFFFFF] p-2.5 border border-[#D1CBBF] font-mono text-[11px] flex flex-col gap-1.5 shadow-sm">
                        <div className="flex items-center justify-between text-[#1D1C13]">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-[#F2637A]" />
                            <span>Living Coral [LC]</span>
                          </span>
                          <span className="font-bold">
                            {record.counts.lc} pts ({record.proportions.lc}%)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[#1D1C13]">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-[#E8A93C]" />
                            <span>Pale / Bleached [PB]</span>
                          </span>
                          <span className="font-bold text-[#8A5B00]">
                            {record.counts.pb} pts ({record.proportions.pb}%)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[#1D1C13]">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-[#8B8378]" />
                            <span>Dead Coral [DC]</span>
                          </span>
                          <span className="font-bold">
                            {record.counts.dc} pts ({record.proportions.dc}%)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[#1D1C13]">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 bg-[#6B7A3A]" />
                            <span>Dead Coral with Algae [DCA]</span>
                          </span>
                          <span className="font-bold text-[#3F4A1E]">
                            {record.counts.dca} pts ({record.proportions.dca}%)
                          </span>
                        </div>

                        {record.proportions.substrate > 0 && (
                          <div className="flex items-center justify-between text-[#70787C] pt-1 border-t border-[#D1CBBF]/60">
                            <span>Substrate / Sand / Shadow</span>
                            <span>
                              {record.counts.substrate} pts ({record.proportions.substrate}%)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Model Pipeline Metrics */}
                      <div className="bg-[#FFFFFF] p-2.5 border border-[#D1CBBF] flex flex-col gap-1 shadow-sm">
                        <div className="flex flex-col gap-0.5 text-[10px] font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-[#70787C]">DETECTOR:</span>
                            <span className="text-[#00475A] font-semibold">{record.detectorModel}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#70787C]">HEALTH CLASSIFIER:</span>
                            <span className="text-[#00475A] font-semibold">{record.classifierModel}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-[10px] font-mono">
                          <div className="flex flex-col bg-[#F9F3E5] p-1.5 border border-[#D1CBBF]/40">
                            <span className="text-[#70787C]">DETECTION IoU</span>
                            <span className="text-sm font-bold text-[#1D1C13]">{record.iou}</span>
                          </div>
                          <div className="flex flex-col bg-[#F9F3E5] p-1.5 border border-[#D1CBBF]/40">
                            <span className="text-[#70787C]">CLASSIFIER CONF</span>
                            <span className="text-sm font-bold text-[#00475A]">
                              {record.meanConfidence}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-[#70787C]">
                          <span>QUADRAT ANALYSIS</span>
                          <span>BATCH ID: {record.batchId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Survey Station Surface Reference (GPS) (3 cols) */}
                  <div className="lg:col-span-3 p-3.5 bg-[#FFFFFF] flex flex-col justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#40484C] font-semibold">
                          Station Surface Reference
                        </span>
                        <span className="font-mono text-[10px] text-[#00475A] font-semibold">
                          SURFACE GPS
                        </span>
                      </div>

                      {/* Mini Map Target Container */}
                      <div
                        className="w-full h-36 bg-[#E7E2D4] bg-cover bg-center relative overflow-hidden border border-[#D1CBBF] shadow-inner flex items-center justify-center"
                        style={{ backgroundImage: `url(${record.mapImage})` }}
                      >
                        {/* Station Pin */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-[#1E5F74] border border-[#FFFFFF] shadow-sm flex items-center justify-center text-white text-[8px] font-bold">
                              •
                            </div>
                            <div className="absolute left-5 top-0 bg-[#16232E] text-white font-mono text-[9px] px-1.5 py-0.5 whitespace-nowrap shadow-sm border border-[#243442]">
                              {record.stationId}
                            </div>
                          </div>
                        </div>

                        {/* Coordinates Watermark */}
                        <div className="absolute bottom-1 right-1 bg-[#FEF9EB]/90 px-1.5 py-0.5 text-[9px] font-mono text-[#1D1C13] border border-[#D1CBBF]">
                          {record.stationCoordinates}
                        </div>
                      </div>

                      {/* Survey Station Context Ledger */}
                      <div className="space-y-0.5 text-[10px] font-mono text-[#40484C]">
                        <div className="flex justify-between py-0.5 border-b border-[#D1CBBF]/40">
                          <span className="text-[#70787C]">STATION ID:</span>
                          <span className="font-semibold text-[#1D1C13]">{record.stationId}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-[#D1CBBF]/40">
                          <span className="text-[#70787C]">REEF SECTOR:</span>
                          <span className="text-[#1D1C13]">{record.stationSector}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-[#D1CBBF]/40">
                          <span className="text-[#70787C]">NOMINAL DEPTH:</span>
                          <span className="font-semibold text-[#1D1C13]">{record.nominalDepth}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-[#70787C]">SAMPLING METHOD:</span>
                          <span className="text-[#1D1C13]">1.0m² Photo-Quadrat</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action CTA Buttons */}
                <div className="bg-[#EDE8DA] px-4 py-2.5 flex items-center justify-end gap-3">
                  <div className="flex items-center gap-2 relative">
                    <button
                      id={`btn-reject-${record.id.toLowerCase()}`}
                      type="button"
                      onClick={() => handleReject(record.id)}
                      className="px-3 py-1.5 bg-[#FFFFFF] border border-[#BA1A1A]/40 text-[#BA1A1A] hover:bg-[#FFDAD6] font-mono text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>

                    {/* Approve Button */}
                    <button
                      id={`btn-approve-${record.id.toLowerCase()}`}
                      type="button"
                      onClick={() => handleApprove(record.id)}
                      className="px-4 py-1.5 bg-[#1E5F74] border border-[#16232E] text-white hover:bg-[#16232E] font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle size={15} />
                      <span>Approve &amp; Ingest Record</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* 3. Sticky Batch Selection Action Floating Bar */}
      <div className="fixed bottom-3 left-20 right-6 z-40 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-[#16232E] text-white border border-[#243442] shadow-2xl px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 max-w-5xl w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#B9EAFF] rounded-full animate-pulse" />
              <span
                id="batch-count-display"
                className="font-mono text-xs font-bold tracking-wider text-[#FEF9EB]"
              >
                {selectedIds.size} SUBMISSIONS SELECTED
              </span>
            </div>

            <button
              id="btn-select-all"
              type="button"
              onClick={handleSelectAllToggle}
              className="font-mono text-xs text-[#C0C8CC] hover:text-white uppercase underline cursor-pointer"
            >
              {selectedIds.size === filteredQueue.length
                ? '[Deselect All]'
                : `[Select All ${filteredQueue.length}]`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-batch-reject"
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleBatchReject}
              className={`px-3 py-1.5 border border-[#F2637A]/40 text-[#F2637A] font-mono text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors ${
                selectedIds.size === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[#BA1A1A]/20 cursor-pointer'
              }`}
            >
              <XCircle size={14} />
              <span>Reject Selected</span>
            </button>

            {/* Bulk Approve Trigger */}
            <button
              id="btn-batch-approve"
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleBatchApprove}
              className={`px-5 py-1.5 bg-[#1E5F74] hover:bg-[#27667B] border border-[#16232E] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all ${
                selectedIds.size === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <CheckCheck size={16} />
              <span id="batch-approve-text">
                Batch Approve &amp; Ingest ({selectedIds.size})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Full 1:1 Image Inspection Modal */}
      {expandedRecord && (
        <div
          id="curation-expand-modal-overlay"
          className="fixed inset-0 z-50 bg-[#16232E]/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedRecord(null)}
        >
          <div
            id="curation-expand-dialog"
            className="w-full max-w-6xl max-h-[95vh] bg-[#FAF8F3] border-2 border-[#16232E] shadow-[8px_8px_0px_#16232E] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#00475A] text-white px-4 py-2.5 border-b border-[#16232E] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#9CD7EF] uppercase tracking-wider">
                  HIGH-RESOLUTION 1:1 INSPECTOR //
                </span>
                <span className="font-serif text-sm font-bold">
                  {expandedRecord.submissionNumber} ({expandedRecord.stationName})
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalBoxes((prev) => !prev)}
                  className={`px-2 py-1 font-mono text-[10px] border ${
                    showModalBoxes
                      ? 'bg-[#1E5F74] text-white border-[#9CD7EF]'
                      : 'bg-transparent text-[#BAC8D7] border-[#BAC8D7]/40'
                  }`}
                >
                  BOXES [{showModalBoxes ? 'ON' : 'OFF'}]
                </button>
                <button
                  type="button"
                  onClick={() => setShowModalGrid((prev) => !prev)}
                  className={`px-2 py-1 font-mono text-[10px] border ${
                    showModalGrid
                      ? 'bg-[#1E5F74] text-white border-[#9CD7EF]'
                      : 'bg-transparent text-[#BAC8D7] border-[#BAC8D7]/40'
                  }`}
                >
                  GRID [{showModalGrid ? 'ON' : 'OFF'}]
                </button>
                <div className="h-4 w-[1px] bg-[#3B4854]" />
                <button
                  type="button"
                  onClick={() => setModalZoom((z) => Math.max(0.75, z - 0.25))}
                  className="px-2 py-0.5 bg-[#16232E] text-white font-mono text-xs hover:bg-[#20303E]"
                >
                  -
                </button>
                <span className="font-mono text-xs px-1 text-[#9CD7EF]">
                  {Math.round(modalZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setModalZoom((z) => Math.min(2.5, z + 0.25))}
                  className="px-2 py-0.5 bg-[#16232E] text-white font-mono text-xs hover:bg-[#20303E]"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setModalZoom(1)}
                  className="px-2 py-0.5 bg-[#16232E] text-white font-mono text-xs hover:bg-[#20303E]"
                  title="Reset Zoom"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedRecord(null)}
                  className="p-1 hover:bg-[#BA1A1A] text-white transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 bg-[#0D1821] overflow-auto flex items-center justify-center p-6 relative">
              <div
                style={{ transform: `scale(${modalZoom})`, transformOrigin: 'center' }}
                className="relative transition-transform duration-150 shadow-2xl border border-[#243442]"
              >
                <img
                  src={expandedRecord.quadratImg}
                  alt={expandedRecord.altText}
                  className="max-h-[75vh] max-w-[85vw] object-contain select-none"
                />

                {/* Synthetic 10x10 calibration grid */}
                {showModalGrid && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-10 grid-rows-10">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div
                        key={i}
                        className="border border-[#FAF8F3]/15 flex items-start justify-start p-0.5"
                      >
                        <span className="text-[7px] font-mono text-white/40">
                          {String.fromCharCode(65 + Math.floor(i / 10))}
                          {(i % 10) + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bounding boxes in expanded view */}
                {showModalBoxes && (
                  <div className="absolute inset-0 pointer-events-none">
                    {expandedRecord.boundingBoxes.map((bb) => (
                      <div
                        key={bb.id}
                        style={{
                          top: bb.top,
                          left: bb.left,
                          width: bb.width,
                          height: bb.height,
                          borderColor: bb.bgColor,
                        }}
                        className="absolute border-2 shadow-sm pointer-events-auto"
                      >
                        <div
                          style={{ backgroundColor: bb.bgColor, color: bb.textColor }}
                          className="absolute -top-4 left-0 font-mono text-[9px] px-1 py-0.5 font-bold shadow-sm whitespace-nowrap"
                        >
                          {bb.label} {bb.confidence} Conf
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF8F3] px-4 py-2 border-t border-[#D1CBBF] flex items-center justify-between text-xs font-mono">
              <span className="text-[#40484C]">
                Station {expandedRecord.stationId} {'//'} {expandedRecord.stationSector} {'//'} Nominal Depth: {expandedRecord.nominalDepth}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(expandedRecord.id);
                    setExpandedRecord(null);
                  }}
                  className="px-3 py-1 bg-[#1E5F74] text-white font-mono text-xs uppercase hover:bg-[#16232E]"
                >
                  Approve &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
