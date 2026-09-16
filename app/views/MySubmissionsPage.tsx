import React, { useState, useMemo } from 'react';
import {
  AddCircle,
  Check,
  Close,
  Search,
  Sync,
  CalendarMonth,
  Tune,
  Image as ImageIcon,
  Radar,
  Visibility,
  Map as MapIcon,
  Assignment,
  Feedback,
  Refresh,
  Download,
  ChevronLeft,
  ChevronRight,
  FindInPage,
  Info,
  Block,
  Warning,
  Cancel,
} from './SubmissionIcons';
import { SubmissionRecord, SubmissionStatus } from '../types';

interface MySubmissionsPageProps {
  submissions: SubmissionRecord[];
  onNavigateToUpload: () => void;
  onNavigateToMap: (stationId?: string) => void;
  onOpenCurationQueue: () => void;
}

export const MySubmissionsPage: React.FC<MySubmissionsPageProps> = ({
  submissions,
  onNavigateToUpload,
  onNavigateToMap,
  onOpenCurationQueue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('FEB 20, 2026 – MAR 05, 2026');
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(
    new Set(['SUB-2026-003'])
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const pageSize = 5;

  const handleRefreshSync = () => {
    setIsRefreshing(true);
    setSyncNotice(null);
    window.setTimeout(() => {
      setIsRefreshing(false);
      setSyncNotice('SYNC COMPLETE');
    }, 600);
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Metrics calculation
  const totalCount = submissions.length;
  const approvedCount = useMemo(
    () => submissions.filter((s) => s.status === 'approved').length,
    [submissions]
  );
  const pendingCount = useMemo(
    () => submissions.filter((s) => s.status === 'pending').length,
    [submissions]
  );
  const rejectedCount = useMemo(
    () => submissions.filter((s) => s.status === 'rejected').length,
    [submissions]
  );

  const approvedPercent = totalCount ? ((approvedCount / totalCount) * 100).toFixed(1) : '0.0';
  const pendingPercent = totalCount ? ((pendingCount / totalCount) * 100).toFixed(1) : '0.0';
  const rejectedPercent = totalCount ? ((rejectedCount / totalCount) * 100).toFixed(1) : '0.0';

  // Filtering
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.file.toLowerCase().includes(q) ||
        item.stationName.toLowerCase().includes(q) ||
        item.transectSector.toLowerCase().includes(q) ||
        item.stationId.toLowerCase().includes(q);

      return matchesStatus && matchesQuery;
    });
  }, [submissions, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredSubmissions.slice(startIndex, startIndex + pageSize);
  }, [filteredSubmissions, safePage, pageSize]);

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'File',
      'Status',
      'Uploaded UTC',
      'Station ID',
      'Station Name',
      'Sector',
      'Coordinates',
      'Depth',
      'LC_Count',
      'PB_Count',
      'DC_Count',
      'DCA_Count',
      'Confidence',
    ];
    const rows = filteredSubmissions.map((s) => [
      s.id,
      s.file,
      s.status,
      `${s.uploadedDate} ${s.uploadedTimeUtc}`,
      s.stationId,
      s.stationName,
      s.transectSector,
      `"${s.coordinates}"`,
      s.depth,
      s.provisionalCounts.lc,
      s.provisionalCounts.pb,
      s.provisionalCounts.dc,
      s.provisionalCounts.dca,
      `${s.confidence}%`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `benthic_submissions_archive_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="my-submissions-page"
      className="flex-1 w-full bg-[#E7E2D4] overflow-y-auto px-6 md:px-8 pt-20 pb-8 text-[#1D1C13]"
    >
      <div className="max-w-7xl mx-auto flex flex-col w-full">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-[#D1CBBF]/80">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#1E5F74]" />
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1D1C13]">
                My Submissions
              </h1>
            </div>
            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[#40484C] flex items-center gap-2 flex-wrap mt-0.5">
              <span>FIELD CONTRIBUTIONS ARCHIVE</span>
              <span className="text-[#D1CBBF]">•</span>
              <span className="text-[#1E5F74] font-semibold">{totalCount} TOTAL SURVEYS</span>
              <span className="text-[#D1CBBF]">•</span>
              <span className="text-[#53606D]">INDEXING CYCLE 2026-Q1</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {syncNotice && (
              <span className="font-mono text-[11px] text-[#00475A] bg-[#FEF9EB] px-2.5 py-1 border border-[#D1CBBF] animate-fade-in">
                {syncNotice}
              </span>
            )}
            <button
              id="refresh-sync-btn"
              type="button"
              onClick={handleRefreshSync}
              className="px-3 py-1.5 bg-[#FEF9EB] border border-[#16232E]/30 hover:bg-[#EDE8DA] transition-colors font-mono text-[11px] text-[#1D1C13] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Sync className={`text-[#53606D] ${isRefreshing ? 'animate-spin' : ''}`} size={16} />
              <span>{isRefreshing ? 'SYNCING...' : 'REFRESH SYNC'}</span>
            </button>
            <button
              id="upload-new-survey-btn"
              type="button"
              onClick={onNavigateToUpload}
              className="px-4 py-1.5 bg-[#1E5F74] text-[#FFFFFF] font-mono text-[11px] font-semibold border border-[#16232E] hover:bg-[#16232E] transition-colors flex items-center gap-1.5 shadow-sm tracking-wide cursor-pointer"
            >
              <AddCircle className="text-[#9CD7EF]" size={16} />
              <span>[+ UPLOAD NEW SURVEY]</span>
            </button>
          </div>
        </div>

        {/* Telemetry Overview Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {/* Card 1 */}
          <div className="bg-[#FAF8F3] border border-[#D1CBBF] p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#53606D]">
                TOTAL SURVEYED
              </span>
              <span className="font-mono text-[10px] text-[#40484C] font-semibold">#ARCHIVE</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#1D1C13]">{totalCount}</span>
              <span className="font-mono text-[10px] text-[#53606D]">1m² quadrats</span>
            </div>
            <div className="w-full bg-[#EDE8DA] h-1 mt-3">
              <div className="bg-[#1E5F74] h-1 w-full" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#FAF8F3] border border-[#D1CBBF] p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#53606D]">
                CURATION APPROVED
              </span>
              <span className="font-mono text-[10px] text-[#00475A] font-semibold flex items-center gap-0.5">
                <Check size={14} /> {approvedPercent}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#00475A]">{approvedCount}</span>
              <span className="font-mono text-[10px] text-[#53606D]">registered to basemap</span>
            </div>
            <div className="w-full bg-[#EDE8DA] h-1 mt-3">
              <div className="bg-[#00475A] h-1" style={{ width: `${approvedPercent}%` }} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#FAF8F3] border border-[#D1CBBF] p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#53606D]">
                PENDING REVIEW
              </span>
              <span className="font-mono text-[10px] text-[#D97706] font-semibold flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-[#D97706] rounded-full" />
                {pendingPercent}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#D97706]">{pendingCount}</span>
              <span className="font-mono text-[10px] text-[#53606D]">awaiting lab QA</span>
            </div>
            <div className="w-full bg-[#EDE8DA] h-1 mt-3">
              <div className="bg-[#D97706] h-1" style={{ width: `${pendingPercent}%` }} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-[#FAF8F3] border border-[#D1CBBF] p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#53606D]">
                DISQUALIFIED / REJECTED
              </span>
              <span className="font-mono text-[10px] text-[#BA1A1A] font-semibold flex items-center gap-0.5">
                <Close size={14} /> {rejectedPercent}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-[#BA1A1A]">{rejectedCount}</span>
              <span className="font-mono text-[10px] text-[#53606D]">optical defect logged</span>
            </div>
            <div className="w-full bg-[#EDE8DA] h-1 mt-3">
              <div className="bg-[#BA1A1A] h-1" style={{ width: `${rejectedPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Filter, Query and Date Range Console */}
        <div className="bg-[#FAF8F3] border border-[#D1CBBF] p-3.5 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-sm">
          {/* Search and Status Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[260px] max-w-sm flex-1">
              <Search
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#70787C] pointer-events-none"
              />
              <input
                id="archive-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1.5 bg-[#FAF8F3] border border-[#16232E] font-mono text-[11px] text-[#1D1C13] placeholder:text-[#70787C] focus:outline-none focus:border-[#1E5F74] focus:ring-1 focus:ring-[#1E5F74] uppercase transition-all"
                placeholder="SEARCH STATION OR FILE..."
              />
              {searchQuery && (
                <button
                  type="button"
                  id="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#70787C] hover:text-[#1D1C13]"
                  title="Clear search"
                >
                  <Close size={14} />
                </button>
              )}
            </div>

            {/* Vertical divider */}
            <div className="hidden sm:block h-6 w-[1px] bg-[#D1CBBF]" />

            {/* Status Filter Segmented Controls */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <span className="font-mono text-[10px] uppercase text-[#53606D] mr-1 whitespace-nowrap">
                STATUS:
              </span>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-mono border transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'border-[#16232E] bg-[#1E5F74] text-[#FFFFFF]'
                    : 'border-[#16232E]/30 bg-[#FAF8F3] text-[#1D1C13] hover:bg-[#F3EEDF]'
                }`}
              >
                ALL ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('pending');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'border-[#16232E] bg-[#1E5F74] text-[#FFFFFF]'
                    : 'border-[#16232E]/30 bg-[#FAF8F3] text-[#1D1C13] hover:bg-[#F3EEDF]'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 bg-[#D97706] rounded-full" />
                PENDING ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('approved');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'approved'
                    ? 'border-[#16232E] bg-[#1E5F74] text-[#FFFFFF]'
                    : 'border-[#16232E]/30 bg-[#FAF8F3] text-[#1D1C13] hover:bg-[#F3EEDF]'
                }`}
              >
                <Check size={12} className={statusFilter === 'approved' ? 'text-[#9CD7EF]' : 'text-[#00475A]'} />
                APPROVED ({approvedCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('rejected');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'rejected'
                    ? 'border-[#16232E] bg-[#1E5F74] text-[#FFFFFF]'
                    : 'border-[#16232E]/30 bg-[#FAF8F3] text-[#1D1C13] hover:bg-[#F3EEDF]'
                }`}
              >
                <Close size={12} className={statusFilter === 'rejected' ? 'text-[#FFFFFF]' : 'text-[#BA1A1A]'} />
                REJECTED ({rejectedCount})
              </button>
            </div>
          </div>

          {/* Date Range & Sorting Filter */}
          <div className="flex items-center gap-2 border-t lg:border-t-0 pt-2 lg:pt-0 border-[#D1CBBF]">
            <div className="flex items-center gap-1.5 bg-[#FAF8F3] border border-[#16232E] px-2.5 py-1">
              <CalendarMonth size={15} className="text-[#53606D]" />
              <label htmlFor="date-range-select" className="sr-only">
                Date Range
              </label>
              <select
                id="date-range-select"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="bg-transparent font-mono text-[10px] text-[#1D1C13] uppercase focus:outline-none cursor-pointer pr-1"
              >
                <option value="FEB 20, 2026 – MAR 05, 2026">FEB 20, 2026 – MAR 05, 2026</option>
                <option value="LAST 30 DAYS">LAST 30 DAYS</option>
                <option value="PREVIOUS EXPEDITION (2025-Q4)">PREVIOUS EXPEDITION (2025-Q4)</option>
                <option value="ALL RECORDS">ALL RECORDS</option>
              </select>
            </div>
            <button
              type="button"
              className="p-1.5 bg-[#FAF8F3] border border-[#16232E]/40 hover:bg-[#F3EEDF] text-[#1D1C13] flex items-center cursor-pointer"
              title="Toggle Filter Options"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              <Tune size={16} />
            </button>
          </div>
        </div>

        {/* Submissions Ledger Table Container */}
        <div className="bg-[#FAF8F3] border border-[#D1CBBF] shadow-sm overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-[#F3EEDF] border-b border-[#D1CBBF] text-[#1D1C13] font-mono text-[10px] uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3 w-28 text-center font-normal border-r border-[#D1CBBF]/60">
                    PREVIEW
                  </th>
                  <th className="py-2.5 px-4 font-semibold border-r border-[#D1CBBF]/60">
                    SURVEY / FILE
                  </th>
                  <th className="py-2.5 px-3 w-36 font-semibold border-r border-[#D1CBBF]/60">
                    UPLOADED (UTC)
                  </th>
                  <th className="py-2.5 px-4 font-semibold border-r border-[#D1CBBF]/60">
                    MONITORING STATION / COORDS
                  </th>
                  <th className="py-2.5 px-4 font-semibold border-r border-[#D1CBBF]/60">
                    PROVISIONAL CLASSIFICATION
                  </th>
                  <th className="py-2.5 px-3 w-32 font-semibold border-r border-[#D1CBBF]/60">
                    STATUS
                  </th>
                  <th className="py-2.5 px-4 w-44 text-right font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1CBBF]/60 font-sans text-xs">
                {paginatedSubmissions.map((row) => {
                  const isRejected = row.status === 'rejected';
                  const isApproved = row.status === 'approved';
                  const isPending = row.status === 'pending';
                  const isExpanded = expandedRowIds.has(row.id);

                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        className={`transition-colors group ${
                          isRejected
                            ? 'bg-[#FFDAD6]/20 hover:bg-[#FFDAD6]/30'
                            : 'hover:bg-[#F9F3E5]'
                        }`}
                        data-file={row.file}
                        data-station={row.stationName}
                        data-status={row.status}
                      >
                        {/* Thumbnail Preview */}
                        <td className="py-3 px-3 border-r border-[#D1CBBF]/40 align-middle text-center">
                          <div
                            className={`relative w-20 h-14 bg-[#F3EEDF] border overflow-hidden mx-auto transition-colors ${
                              isRejected
                                ? 'border-[#BA1A1A]/50'
                                : 'border-[#16232E]/30 group-hover:border-[#1E5F74]'
                            }`}
                          >
                            <img
                              src={row.thumbnailUrl}
                              alt={row.altText}
                              className={`w-full h-full object-cover transition-all duration-300 ${
                                isRejected
                                  ? 'opacity-75'
                                  : 'grayscale-[20%] group-hover:grayscale-0'
                              }`}
                            />
                            {isRejected ? (
                              <span className="absolute inset-0 bg-[#BA1A1A]/15 flex items-center justify-center">
                                <Block size={18} className="text-[#BA1A1A]" />
                              </span>
                            ) : (
                              <span className="absolute bottom-0.5 right-0.5 px-1 bg-[#16232E]/80 text-[#FAF8F3] font-mono text-[9px] leading-tight">
                                1m²
                              </span>
                            )}
                          </div>
                        </td>

                        {/* File Name & Meta */}
                        <td className="py-3 px-4 border-r border-[#D1CBBF]/40 align-top">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              {isRejected ? (
                                <Warning size={15} className="text-[#BA1A1A]" />
                              ) : (
                                <ImageIcon size={15} className="text-[#1E5F74]" />
                              )}
                              <span
                                className={`font-mono text-[11px] font-semibold ${
                                  isRejected ? 'text-[#BA1A1A]' : 'text-[#1D1C13]'
                                }`}
                              >
                                {row.file}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-[#53606D] flex items-center gap-2 flex-wrap">
                              <span>{row.fileSize}</span>
                              <span className="text-[#D1CBBF]">•</span>
                              <span>{row.format}</span>
                              <span className="text-[#D1CBBF]">•</span>
                              <span className={isRejected ? 'text-[#BA1A1A] font-medium' : 'text-[#39460B]'}>
                                {row.cameraSettings ?? 'CAMERA DATA N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Upload Date */}
                        <td className="py-3 px-3 border-r border-[#D1CBBF]/40 align-top font-mono text-[10px] text-[#1D1C13]">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#1D1C13]">{row.uploadedDate}</span>
                            <span className="text-[#53606D] tabular-nums">{row.uploadedTimeUtc}</span>
                          </div>
                        </td>

                        {/* Station & Coordinates */}
                        <td className="py-3 px-4 border-r border-[#D1CBBF]/40 align-top">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <Radar size={14} className={isRejected ? 'text-[#53606D]' : 'text-[#00475A]'} />
                              <span className="font-serif text-[13px] leading-tight text-[#1D1C13] font-semibold">
                                {row.stationName}
                              </span>
                              <span
                                className={`text-[10px] font-mono ${
                                  isRejected ? 'text-[#BA1A1A]' : 'text-[#53606D]'
                                }`}
                              >
                                ({row.transectSector})
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-[#40484C] tabular-nums">
                              {row.coordinates}
                            </span>
                            <span className="font-mono text-[10px] text-[#53606D]">
                              Depth: {row.depth} · Diver: {row.diver ?? 'UNASSIGNED'}
                            </span>
                          </div>
                        </td>

                        {/* Classification breakdown */}
                        <td className="py-3 px-4 border-r border-[#D1CBBF]/40 align-top">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-[#FAF8F3] border border-[#16232E]/30 font-mono text-[10px] text-[#1D1C13] flex items-center gap-1">
                                <span className="text-[#F2637A] font-bold">■</span> LC:{' '}
                                <span className="font-semibold">{row.provisionalCounts.lc}</span>
                              </span>
                              <span className="px-1.5 py-0.5 bg-[#FAF8F3] border border-[#16232E]/30 font-mono text-[10px] text-[#1D1C13] flex items-center gap-1">
                                <span className="text-[#E8A93C] font-bold">◇</span> PB:{' '}
                                <span className="font-semibold">{row.provisionalCounts.pb}</span>
                              </span>
                              <span className="px-1.5 py-0.5 bg-[#FAF8F3] border border-[#16232E]/30 font-mono text-[10px] text-[#1D1C13] flex items-center gap-1">
                                <span className="text-[#8B8378] font-bold">✕</span> DC:{' '}
                                <span className="font-semibold">{row.provisionalCounts.dc}</span>
                              </span>
                              <span className="px-1.5 py-0.5 bg-[#FAF8F3] border border-[#16232E]/30 font-mono text-[10px] text-[#1D1C13] flex items-center gap-1">
                                <span className="text-[#6B7A3A] font-bold">▤</span> DCA:{' '}
                                <span className="font-semibold">{row.provisionalCounts.dca}</span>
                              </span>
                            </div>

                            {/* Mini Progress Distribution */}
                            {isRejected ? (
                              <div className="font-mono text-[10px] text-[#BA1A1A] flex items-center gap-1">
                                <Cancel size={12} />
                                <span>Confidence: {row.confidence}% (Unreliable)</span>
                              </div>
                            ) : (
                              <div
                                className="w-full bg-[#EDE8DA] h-1.5 flex overflow-hidden border border-[#16232E]/10"
                                title={`Provisional ratio: LC ${row.ratios.lc}% | PB ${row.ratios.pb}% | DC ${row.ratios.dc}% | DCA ${row.ratios.dca}%`}
                              >
                                <div className="bg-[#F2637A] h-full" style={{ width: `${row.ratios.lc}%` }} />
                                <div className="bg-[#E8A93C] h-full" style={{ width: `${row.ratios.pb}%` }} />
                                <div className="bg-[#8B8378] h-full" style={{ width: `${row.ratios.dc}%` }} />
                                <div className="bg-[#6B7A3A] h-full" style={{ width: `${row.ratios.dca}%` }} />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Indicator */}
                        <td className="py-3 px-3 border-r border-[#D1CBBF]/40 align-top">
                          {isPending && (
                            <>
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FAF8F3] border border-[#D97706]/50">
                                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                                <span className="font-mono text-[10px] font-semibold text-[#B45309] uppercase tracking-wide">
                                  Pending
                                </span>
                              </div>
                              <p className="font-mono text-[10px] text-[#53606D] mt-1">
                                {row.statusDetail}
                              </p>
                            </>
                          )}

                          {isApproved && (
                            <>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1E5F74]/10 border border-[#1E5F74]">
                                <Check size={14} className="text-[#1E5F74] font-bold" />
                                <span className="font-mono text-[10px] font-semibold text-[#1E5F74] uppercase tracking-wide">
                                  Approved
                                </span>
                              </div>
                              <p className="font-mono text-[10px] text-[#53606D] mt-1">
                                {row.statusDetail}
                              </p>
                            </>
                          )}

                          {isRejected && (
                            <>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#BA1A1A]/10 border border-[#BA1A1A]">
                                <Close size={14} className="text-[#BA1A1A] font-bold" />
                                <span className="font-mono text-[10px] font-semibold text-[#BA1A1A] uppercase tracking-wide">
                                  Rejected
                                </span>
                              </div>
                              <p className="font-mono text-[10px] text-[#BA1A1A] mt-1">
                                {row.statusDetail}
                              </p>
                            </>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                            {isPending && (
                              <button
                                type="button"
                                onClick={onNavigateToUpload}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#F3EEDF] border border-[#16232E] hover:bg-[#EDE8DA] text-[#1D1C13] font-mono text-[10px] uppercase transition-colors cursor-pointer"
                              >
                                <Visibility size={14} />
                                <span>View Inspection</span>
                              </button>
                            )}

                            {isApproved && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onNavigateToMap(row.stationId)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F3EEDF] border border-[#16232E] hover:bg-[#EDE8DA] text-[#1D1C13] font-mono text-[10px] uppercase transition-colors cursor-pointer"
                                >
                                  <MapIcon size={13} />
                                  <span>View in Map</span>
                                </button>
                                {row.id === 'SUB-2026-002' && (
                                  <button
                                    type="button"
                                    onClick={onOpenCurationQueue}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1E5F74] text-[#FAF8F3] border border-[#16232E] hover:bg-[#16232E] font-mono text-[10px] uppercase transition-colors cursor-pointer"
                                  >
                                    <Assignment size={13} />
                                    <span>Inspection Report</span>
                                  </button>
                                )}
                              </>
                            )}

                            {isRejected && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpansion(row.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F3EEDF] border border-[#16232E] hover:bg-[#EDE8DA] text-[#1D1C13] font-mono text-[10px] uppercase transition-colors cursor-pointer"
                                >
                                  <Feedback size={13} />
                                  <span>{isExpanded ? 'Hide Note' : 'View Note'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={onNavigateToUpload}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#BA1A1A] border border-[#16232E] hover:bg-[#16232E] text-[#FFFFFF] font-mono text-[10px] uppercase transition-colors cursor-pointer"
                                >
                                  <Refresh size={13} />
                                  <span>Re-upload</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Reviewer Note Marginalia Drawer for Rejected Records */}
                      {isRejected && isExpanded && row.rejectReason && (
                        <tr className="bg-[#F9F3E5] border-b border-[#D1CBBF]/80">
                          <td className="py-3 px-6" colSpan={7}>
                            <div className="border-l-4 border-[#BA1A1A] bg-[#FAF8F3] p-3.5 border-r border-t border-b border-[#D1CBBF] shadow-sm">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex flex-col gap-1 max-w-3xl">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[10px] text-[#BA1A1A] uppercase font-bold tracking-wider">
                                      {row.rejectReason.recordCode}
                                    </span>
                                    <span className="text-[#D1CBBF]">|</span>
                                    <span className="font-mono text-[10px] text-[#53606D]">
                                      Reviewer: {row.rejectReason.reviewer}
                                    </span>
                                  </div>
                                  <p className="font-serif text-[13px] leading-relaxed italic text-[#1D1C13] mt-1">
                                    &ldquo;{row.rejectReason.note}&rdquo;
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="font-mono text-[10px] text-[#53606D]">
                                    {row.rejectReason.codeDetail}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={onNavigateToUpload}
                                    className="text-[#BA1A1A] font-mono text-[10px] uppercase underline hover:text-[#1D1C13] font-semibold cursor-pointer"
                                  >
                                    Proceed to Guided Resubmission →
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state when filter/search returns 0 rows */}
          {filteredSubmissions.length === 0 && (
            <div className="p-8 text-center bg-[#FAF8F3]">
              <div className="flex justify-center mb-2">
                <FindInPage size={32} className="text-[#70787C]" />
              </div>
              <p className="font-serif text-lg text-[#1D1C13] font-bold">
                No matching archival surveys located
              </p>
              <p className="font-sans text-xs text-[#53606D] mt-1">
                Adjust keyword search or status filter constraints.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-3 py-1 bg-[#1E5F74] text-[#FFFFFF] font-mono text-[11px] uppercase cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

        {/* Bottom Summary & Pagination Ledger Bar */}
        <div className="bg-[#FAF8F3] border border-[#D1CBBF] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-sm mb-4">
          {/* Audit Summary Text */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 font-mono text-[10px]">
            <span className="font-semibold text-[#1D1C13]">
              Showing {paginatedSubmissions.length} of {totalCount} submissions
            </span>
            <span className="hidden sm:inline text-[#D1CBBF]">|</span>
            <div className="flex items-center gap-3 text-[#53606D] flex-wrap">
              <span className="flex items-center gap-1 text-[#00475A] font-medium">
                <Check size={12} /> Approved: {approvedCount}
              </span>
              <span className="flex items-center gap-1 text-[#D97706] font-medium">
                <span className="inline-block w-1.5 h-1.5 bg-[#D97706] rounded-full" />
                Pending Review: {pendingCount}
              </span>
              <span className="flex items-center gap-1 text-[#BA1A1A] font-medium">
                <Close size={12} /> Rejected: {rejectedCount}
              </span>
            </div>
          </div>

          {/* Export & Pagination Controls */}
          <div className="flex items-center gap-3.5 self-end md:self-auto flex-wrap">
            {/* CSV Export Action */}
            <button
              type="button"
              id="export-csv-ledger-btn"
              onClick={handleExportCsv}
              className="px-3 py-1 border border-[#16232E] bg-[#F3EEDF] hover:bg-[#EDE8DA] transition-colors text-[#1D1C13] font-mono text-[10px] uppercase flex items-center gap-1 cursor-pointer"
            >
              <Download size={14} className="text-[#53606D]" />
              <span>EXPORT CSV LEDGER</span>
            </button>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-2 py-1 border font-mono text-[10px] ${
                  safePage <= 1
                    ? 'border-[#16232E]/30 bg-[#EDE8DA] text-[#70787C] cursor-not-allowed'
                    : 'border-[#16232E]/40 bg-[#FAF8F3] hover:bg-[#F3EEDF] text-[#1D1C13] cursor-pointer'
                }`}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`px-2.5 py-1 border font-mono text-[10px] cursor-pointer ${
                    safePage === pg
                      ? 'border-[#16232E] bg-[#1E5F74] text-[#FFFFFF] font-bold'
                      : 'border-[#16232E]/40 bg-[#FAF8F3] hover:bg-[#F3EEDF] text-[#1D1C13]'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-2 py-1 border font-mono text-[10px] ${
                  safePage >= totalPages
                    ? 'border-[#16232E]/30 bg-[#EDE8DA] text-[#70787C] cursor-not-allowed'
                    : 'border-[#16232E]/40 bg-[#FAF8F3] hover:bg-[#F3EEDF] text-[#1D1C13] cursor-pointer'
                }`}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footnote Marginalia Annotation Card */}
        <div className="border border-[#D1CBBF] bg-[#FAF8F3] p-3.5 mb-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[#1E5F74] mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#1E5F74]">
                  FIELD OPERATOR PROTOCOL NOTICE
                </span>
                <span className="text-[10px] text-[#53606D] font-mono">[STN-STD-v4.2]</span>
              </div>
              <p className="font-sans text-xs text-[#40484C] leading-relaxed">
                Approved transect quadrats are integrated into the GBR Long-Term Benthic Health
                Basemap within 4 hours of senior taxonomist sign-off. Rejected captures may be
                resubmitted with strobe calibration metadata. Provisional point-intercept counts
                reflect automatic neural network inference (Benthic-YOLO v8.4, 95.8% F1-score on
                Indo-Pacific scleractinian corals).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
