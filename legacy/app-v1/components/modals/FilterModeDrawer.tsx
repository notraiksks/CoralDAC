import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { MapFilters } from '../../types';

interface FilterModeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MapFilters;
  onChangeFilters: (filters: MapFilters) => void;
  minDepth: number;
  maxDepth: number;
  onDepthChange: (min: number, max: number) => void;
}

const CLASS_ROWS: { key: 'lc' | 'pb' | 'dc' | 'dca'; label: string; color: string }[] = [
  { key: 'lc', label: 'Living coral', color: 'var(--color-reef-lc)' },
  { key: 'pb', label: 'Partially bleached', color: 'var(--color-reef-pb)' },
  { key: 'dc', label: 'Dead coral', color: 'var(--color-reef-dc)' },
  { key: 'dca', label: 'Dead coral with algae', color: 'var(--color-reef-dca)' },
];

export const FilterModeDrawer: React.FC<FilterModeDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  minDepth,
  maxDepth,
  onDepthChange,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="filter-mode-overlay"
      className="fixed inset-0 z-50 bg-[#051418]/50 backdrop-blur-[2px] flex justify-end"
      onClick={onClose}
    >
      <div
        id="filter-mode-drawer"
        className="w-full max-w-sm h-full bg-gradient-to-b from-[#0F3138] to-[#0A2830] border-l border-[color:var(--color-reef-line)] shadow-2xl flex flex-col p-5 overflow-y-auto font-reef-body"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--color-reef-line)] pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[color:var(--color-reef-accent)]" />
            <h2 className="font-reef-display text-[16px] font-semibold text-[color:var(--color-reef-sand)]">
              Map filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[color:var(--color-reef-sand-dim)] hover:text-[color:var(--color-reef-sand)] p-1 cursor-pointer"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters List */}
        <div className="flex flex-col gap-5 text-[13px] text-[color:var(--color-reef-sand)]">
          {/* Depth Range Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[color:var(--color-reef-sand-dim)] text-[11px] uppercase tracking-wide">
              Station depth
            </span>
            <div className="flex justify-between font-medium tabular-nums">
              <span>{minDepth}m</span>
              <span className="text-[color:var(--color-reef-sand-dim)]">to</span>
              <span>{maxDepth}m</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={maxDepth}
              onChange={(e) => onDepthChange(minDepth, parseInt(e.target.value, 10))}
              className="w-full accent-[color:var(--color-reef-shallow-2)] h-1.5 cursor-pointer"
            />
            <span className="text-[11px] text-[color:var(--color-reef-sand-dim)]">
              Only show stations within this depth range.
            </span>
          </div>

          {/* Heatmap Bloom Calibration */}
          <div className="flex flex-col gap-2 border-t border-[color:var(--color-reef-line)] pt-4">
            <span className="text-[color:var(--color-reef-sand-dim)] text-[11px] uppercase tracking-wide">
              Heatmap intensity
            </span>
            <div className="flex justify-between font-medium tabular-nums">
              <span className="text-[color:var(--color-reef-sand-dim)]">Opacity</span>
              <span>{filters.heatmapIntensity}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={filters.heatmapIntensity}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  heatmapIntensity: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-[color:var(--color-reef-shallow-2)] h-1.5 cursor-pointer"
            />
          </div>

          {/* ResNet50 Confidence Threshold */}
          <div className="flex flex-col gap-2 border-t border-[color:var(--color-reef-line)] pt-4">
            <span className="text-[color:var(--color-reef-sand-dim)] text-[11px] uppercase tracking-wide">
              ResNet50 confidence, minimum
            </span>
            <div className="flex justify-between font-medium tabular-nums">
              <span className="text-[color:var(--color-reef-sand-dim)]">Minimum</span>
              <span>≥ {(filters.detectionConfidence / 100).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={50}
              max={99}
              value={filters.detectionConfidence}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  detectionConfidence: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-[color:var(--color-reef-shallow-2)] h-1.5 cursor-pointer"
            />
            <span className="text-[11px] text-[color:var(--color-reef-sand-dim)]">
              Quadrats below this classifier confidence are hidden from station drill-down.
            </span>
          </div>

          {/* Dual-Coded Layer Visibility */}
          <div className="flex flex-col gap-2 border-t border-[color:var(--color-reef-line)] pt-4">
            <span className="text-[color:var(--color-reef-sand-dim)] text-[11px] uppercase tracking-wide">
              Health classes
            </span>
            {CLASS_ROWS.map((c) => (
              <label key={c.key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.layers[c.key]}
                  onChange={() =>
                    onChangeFilters({
                      ...filters,
                      layers: { ...filters.layers, [c.key]: !filters.layers[c.key] },
                    })
                  }
                  className="w-3.5 h-3.5 accent-[color:var(--color-reef-accent)]"
                />
                <span
                  className="reef-r-sm w-3 h-3 flex-shrink-0"
                  style={{ background: c.color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)' }}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-5 border-t border-[color:var(--color-reef-line)] flex gap-2">
          <button
            onClick={() => {
              onChangeFilters({
                layers: { lc: true, pb: true, dc: true, dca: true },
                heatmapIntensity: 75,
                detectionConfidence: 85,
              });
              onDepthChange(0, 50);
            }}
            className="reef-r-md flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-[color:var(--color-reef-sand)] text-[12.5px] font-medium transition-colors cursor-pointer"
            type="button"
          >
            Reset filters
          </button>
          <button
            onClick={onClose}
            className="reef-r-md flex-1 py-2.5 bg-[color:var(--color-reef-accent)] hover:brightness-110 text-[#1A0D08] text-[12.5px] font-semibold transition-all cursor-pointer"
            type="button"
          >
            Apply &amp; view
          </button>
        </div>
      </div>
    </div>
  );
};
