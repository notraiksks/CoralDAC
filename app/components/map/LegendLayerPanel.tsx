import React, { useState } from 'react';
import { Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { MapFilters } from '../../types';

interface LegendLayerPanelProps {
  filters: MapFilters;
  onChangeFilters: (newFilters: MapFilters) => void;
}

export const LegendLayerPanel: React.FC<LegendLayerPanelProps> = ({
  filters,
  onChangeFilters,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLayer = (layerKey: keyof MapFilters['layers']) => {
    onChangeFilters({
      ...filters,
      layers: {
        ...filters.layers,
        [layerKey]: !filters.layers[layerKey],
      },
    });
  };

  const handleSelectAll = () => {
    const allActive =
      filters.layers.lc &&
      filters.layers.pb &&
      filters.layers.dc &&
      filters.layers.dca;
    const nextState = !allActive;
    onChangeFilters({
      ...filters,
      layers: {
        lc: nextState,
        pb: nextState,
        dc: nextState,
        dca: nextState,
      },
    });
  };

  return (
    <div
      id="legend-layer-control-panel"
      className="w-80 bg-[#FAF8F3] border border-[#16232E] shadow-[3px_3px_0px_#16232E] z-30 flex flex-col pointer-events-auto select-none"
    >
      {/* Panel Header */}
      <div className="px-3.5 py-1.5 bg-[#EDE8DA] border-b border-[#16232E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#00475A]" />
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-[#1D1C13]">
            Legend &amp; Layers
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-[#F3EEDF] px-1.5 py-0.5 border border-[#C0C8CC] text-[#53606D]">
            N=420 pts · 18 STNS
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[#53606D] hover:text-[#16232E] p-0.5"
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            type="button"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3.5 flex flex-col gap-3">
          {/* Health Category Selection Matrix */}
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#53606D] flex justify-between items-center">
              <span>Benthic Health Classes (Dual-Coded)</span>
              <button
                id="btn-select-all-layers"
                onClick={handleSelectAll}
                className="text-[#00475A] font-semibold cursor-pointer hover:underline uppercase text-[10px]"
                type="button"
              >
                {filters.layers.lc &&
                filters.layers.pb &&
                filters.layers.dc &&
                filters.layers.dca
                  ? 'Deselect'
                  : 'Select All'}
              </button>
            </div>

            {/* Class 1: Living Coral */}
            <label
              id="layer-toggle-lc"
              className="flex items-center justify-between p-1.5 bg-[#FEF9EB] border border-[#C0C8CC] hover:border-[#16232E] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.layers.lc}
                  onChange={() => toggleLayer('lc')}
                  className="w-3.5 h-3.5 accent-[#00475A] cursor-pointer"
                />
                <span className="font-mono text-xs text-[#F2637A] font-bold">
                  ●
                </span>
                <span className="font-sans text-xs font-medium text-[#1D1C13]">
                  Living Coral
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-1 py-0.2 bg-[#F2637A]/15 text-[#1D1C13] font-semibold border border-[#F2637A]/40">
                  [LC]
                </span>
                <span className="font-mono text-[10px] text-[#53606D] tabular-nums">
                  48.2%
                </span>
              </div>
            </label>

            {/* Class 2: Partially Bleached */}
            <label
              id="layer-toggle-pb"
              className="flex items-center justify-between p-1.5 bg-[#FEF9EB] border border-[#C0C8CC] hover:border-[#16232E] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.layers.pb}
                  onChange={() => toggleLayer('pb')}
                  className="w-3.5 h-3.5 accent-[#00475A] cursor-pointer"
                />
                <span className="font-mono text-xs text-[#E8A93C] font-bold">
                  ▲
                </span>
                <span className="font-sans text-xs font-medium text-[#1D1C13]">
                  Partially Bleached
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-1 py-0.2 bg-[#E8A93C]/15 text-[#1D1C13] font-semibold border border-[#E8A93C]/40">
                  [PB]
                </span>
                <span className="font-mono text-[10px] text-[#53606D] tabular-nums">
                  26.1%
                </span>
              </div>
            </label>

            {/* Class 3: Dead Coral */}
            <label
              id="layer-toggle-dc"
              className="flex items-center justify-between p-1.5 bg-[#FEF9EB] border border-[#C0C8CC] hover:border-[#16232E] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.layers.dc}
                  onChange={() => toggleLayer('dc')}
                  className="w-3.5 h-3.5 accent-[#00475A] cursor-pointer"
                />
                <span className="font-mono text-xs text-[#8B8378] font-bold">
                  ■
                </span>
                <span className="font-sans text-xs font-medium text-[#1D1C13]">
                  Dead Coral
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-1 py-0.2 bg-[#8B8378]/15 text-[#1D1C13] font-semibold border border-[#8B8378]/40">
                  [DC]
                </span>
                <span className="font-mono text-[10px] text-[#53606D] tabular-nums">
                  14.3%
                </span>
              </div>
            </label>

            {/* Class 4: Dead Coral + Algae */}
            <label
              id="layer-toggle-dca"
              className="flex items-center justify-between p-1.5 bg-[#FEF9EB] border border-[#C0C8CC] hover:border-[#16232E] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.layers.dca}
                  onChange={() => toggleLayer('dca')}
                  className="w-3.5 h-3.5 accent-[#00475A] cursor-pointer"
                />
                <span className="font-mono text-xs text-[#6B7A3A] font-bold">
                  ◆
                </span>
                <span className="font-sans text-xs font-medium text-[#1D1C13]">
                  Dead Coral + Algae
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-1 py-0.2 bg-[#6B7A3A]/15 text-[#1D1C13] font-semibold border border-[#6B7A3A]/40">
                  [DCA]
                </span>
                <span className="font-mono text-[10px] text-[#53606D] tabular-nums">
                  11.4%
                </span>
              </div>
            </label>
          </div>

          {/* Interactive Sliders & Calibration Controls */}
          <div className="flex flex-col gap-2.5 pt-1.5 border-t border-[#C0C8CC]">
            {/* Heatmap Intensity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-[#53606D] uppercase tracking-wider">
                  Heatmap Intensity
                </span>
                <span className="font-semibold text-[#1D1C13] tabular-nums">
                  {filters.heatmapIntensity}%
                </span>
              </div>
              <input
                id="slider-heatmap-intensity"
                className="w-full accent-[#00475A] h-1.5 bg-[#F3EEDF] cursor-pointer"
                max={100}
                min={10}
                type="range"
                value={filters.heatmapIntensity}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    heatmapIntensity: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>

            {/* Detection Confidence Threshold */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-[#53606D] uppercase tracking-wider">
                  ResNet50 Confidence
                </span>
                <span className="font-semibold text-[#1D1C13] tabular-nums">
                  ≥ {(filters.detectionConfidence / 100).toFixed(2)} Conf
                </span>
              </div>
              <input
                id="slider-detection-confidence"
                className="w-full accent-[#00475A] h-1.5 bg-[#F3EEDF] cursor-pointer"
                max={99}
                min={50}
                type="range"
                value={filters.detectionConfidence}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    detectionConfidence: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          </div>

          {/* Permanent Scientific Disclosure Notice */}
          <div className="pt-1.5 border-t border-[#C0C8CC]">
            <p className="font-sans text-[10px] text-[#53606D] italic leading-relaxed">
              * Notice: Locations reflect survey station reference coordinates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
