import React from 'react';
import { X, Sliders } from 'lucide-react';
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
      className="fixed inset-0 z-50 bg-[#16232E]/50 flex justify-end"
      onClick={onClose}
    >
      <div
        id="filter-mode-drawer"
        className="w-full max-w-sm h-full bg-[#FAF8F3] border-l-2 border-[#16232E] shadow-[-4px_0px_0px_#16232E] flex flex-col p-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#16232E] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-[#00475A]" />
            <h2 className="font-serif text-lg font-bold text-[#1D1C13]">
              Reef Health Filter Mode
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#1D1C13] hover:text-[#00475A] p-1 cursor-pointer"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters List */}
        <div className="flex flex-col gap-5 font-mono text-xs text-[#1D1C13]">
          {/* Depth Range Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[#53606D] uppercase text-[10px] font-bold tracking-wider">
              Station Depth Envelope
            </span>
            <div className="flex justify-between font-bold">
              <span>{minDepth}m</span>
              <span>to</span>
              <span>{maxDepth}m</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={maxDepth}
              onChange={(e) => onDepthChange(minDepth, parseInt(e.target.value, 10))}
              className="w-full accent-[#00475A] h-1.5 bg-[#EDE8DA] cursor-pointer"
            />
            <span className="text-[10px] text-[#53606D]">
              Constrains display to stations within depth sounding range.
            </span>
          </div>

          {/* Heatmap Bloom Calibration */}
          <div className="flex flex-col gap-2 border-t border-[#C0C8CC] pt-4">
            <span className="text-[#53606D] uppercase text-[10px] font-bold tracking-wider">
              Benthic Heatmap Intensity
            </span>
            <div className="flex justify-between font-bold">
              <span>Opacity:</span>
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
              className="w-full accent-[#00475A] h-1.5 bg-[#EDE8DA] cursor-pointer"
            />
          </div>

          {/* ResNet50 Confidence Threshold */}
          <div className="flex flex-col gap-2 border-t border-[#C0C8CC] pt-4">
            <span className="text-[#53606D] uppercase text-[10px] font-bold tracking-wider">
              ResNet50 Classification Confidence
            </span>
            <div className="flex justify-between font-bold">
              <span>Minimum Confidence:</span>
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
              className="w-full accent-[#00475A] h-1.5 bg-[#EDE8DA] cursor-pointer"
            />
          </div>

          {/* Dual-Coded Layer Visibility */}
          <div className="flex flex-col gap-2 border-t border-[#C0C8CC] pt-4">
            <span className="text-[#53606D] uppercase text-[10px] font-bold tracking-wider">
              Benthic Health Classes
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.layers.lc}
                onChange={() =>
                  onChangeFilters({
                    ...filters,
                    layers: { ...filters.layers, lc: !filters.layers.lc },
                  })
                }
                className="w-3.5 h-3.5 accent-[#00475A]"
              />
              <span className="text-[#F2637A] font-bold">● [LC]</span>
              <span>Living Coral Colonies</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.layers.pb}
                onChange={() =>
                  onChangeFilters({
                    ...filters,
                    layers: { ...filters.layers, pb: !filters.layers.pb },
                  })
                }
                className="w-3.5 h-3.5 accent-[#00475A]"
              />
              <span className="text-[#E8A93C] font-bold">▲ [PB]</span>
              <span>Partially Bleached Tissue</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.layers.dc}
                onChange={() =>
                  onChangeFilters({
                    ...filters,
                    layers: { ...filters.layers, dc: !filters.layers.dc },
                  })
                }
                className="w-3.5 h-3.5 accent-[#00475A]"
              />
              <span className="text-[#8B8378] font-bold">■ [DC]</span>
              <span>Dead Calcareous Skeleton</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.layers.dca}
                onChange={() =>
                  onChangeFilters({
                    ...filters,
                    layers: { ...filters.layers, dca: !filters.layers.dca },
                  })
                }
                className="w-3.5 h-3.5 accent-[#00475A]"
              />
              <span className="text-[#6B7A3A] font-bold">◆ [DCA]</span>
              <span>Dead Coral with Turf Algae</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-[#C0C8CC] flex gap-2">
          <button
            onClick={() => {
              onChangeFilters({
                layers: { lc: true, pb: true, dc: true, dca: true },
                heatmapIntensity: 75,
                detectionConfidence: 85,
              });
              onDepthChange(0, 50);
            }}
            className="flex-1 py-2 bg-[#FEF9EB] border border-[#16232E] hover:bg-[#EDE8DA] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            type="button"
          >
            Reset Filters
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-[#00475A] text-white border border-[#16232E] hover:bg-[#16232E] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            type="button"
          >
            Apply &amp; View
          </button>
        </div>
      </div>
    </div>
  );
};
