import React from 'react';
import { X, ArrowRight, BarChart3, History } from 'lucide-react';
import { StationData } from '../../types';

interface StationHUDProps {
  station: StationData;
  onClose: () => void;
  onOpenTriage: () => void;
  onOpenDetail: () => void;
  onOpenPastTransects: () => void;
}

export const StationHUD: React.FC<StationHUDProps> = ({
  station,
  onClose,
  onOpenTriage,
  onOpenDetail,
  onOpenPastTransects,
}) => {
  return (
    <div
      id={`station-hud-${station.id.toLowerCase()}`}
      className="w-[380px] max-w-[94vw] bg-[#FAF8F3] border border-[#16232E] shadow-[3px_3px_0px_#16232E] z-30 pointer-events-auto select-none"
    >
      {/* HUD Title Bar */}
      <div className="bg-[#00475A] text-[#FAF8F3] px-3.5 py-1.5 flex items-center justify-between border-b border-[#16232E]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#FAF8F3]" />
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase">
            STN // {station.id}
          </span>
          <span className="text-[#9CD7EF] font-mono text-[10px] uppercase">
            [TRANSECT {station.transect}]
          </span>
        </div>
        <button
          id="btn-hud-close"
          onClick={onClose}
          className="text-[#FAF8F3] hover:text-[#9CD7EF] transition-colors p-0.5 cursor-pointer"
          title="Dismiss Inspector HUD"
          type="button"
        >
          <X size={15} />
        </button>
      </div>

      {/* Station Content Body */}
      <div className="p-3.5 flex flex-col gap-2.5 text-[#1D1C13]">
        {/* Sub-header station & sector info */}
        <div className="flex justify-between items-start border-b border-[#C0C8CC] pb-2">
          <div>
            <h2 className="font-serif text-lg text-[#00475A] font-bold leading-snug">
              {station.name}
            </h2>
          </div>
          <div className="text-right font-mono text-[11px] text-[#53606D]">
            <div>
              DEPTH:{' '}
              <strong className="text-[#1D1C13] font-semibold">
                {station.depth}m
              </strong>
            </div>
            <div>
              TRANSECT:{' '}
              <strong className="text-[#1D1C13] font-semibold">
                {station.transect}
              </strong>
            </div>
          </div>
        </div>

        {/* Precise Marine Coordinates */}
        <div className="bg-[#F3EEDF] px-2.5 py-1 border border-[#C0C8CC] flex items-center justify-between font-mono text-[11px]">
          <span className="text-[#53606D] uppercase text-[10px]">
            COORDINATES:
          </span>
          <span className="font-semibold text-[#1D1C13] font-mono text-xs">
            {station.coordinates}
          </span>
        </div>

        {/* Benthic Health Proportional Composition Bar */}
        <div className="flex flex-col gap-1 pt-0.5">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-[#53606D] uppercase tracking-wider font-semibold">
              Health Ratio (ResNet50 Stage)
            </span>
            <span className="text-[#1D1C13] font-semibold">
              N = {station.quadratsCount} Quadrats
            </span>
          </div>

          {/* Multi-Segment Visual Stacked Health Bar */}
          <div
            className="w-full h-4 bg-[#E7E2D4] border border-[#16232E] flex overflow-hidden cursor-crosshair"
            title={`Living: ${station.health.lc}%, Bleached: ${station.health.pb}%, Dead: ${station.health.dc}%, Algae: ${station.health.dca}%`}
          >
            {/* Living Coral (LC) */}
            <div
              className="h-full bg-[#F2637A] border-r border-[#16232E] transition-all duration-300"
              style={{ width: `${station.health.lc}%` }}
              title={`[LC] Living Coral: ${station.health.lc}%`}
            />
            {/* Partially Bleached (PB) */}
            <div
              className="h-full bg-[#E8A93C] border-r border-[#16232E] transition-all duration-300"
              style={{ width: `${station.health.pb}%` }}
              title={`[PB] Partially Bleached: ${station.health.pb}%`}
            />
            {/* Dead Coral (DC) */}
            <div
              className="h-full bg-[#8B8378] border-r border-[#16232E] transition-all duration-300"
              style={{ width: `${station.health.dc}%` }}
              title={`[DC] Dead Coral: ${station.health.dc}%`}
            />
            {/* Dead Coral + Algae (DCA) */}
            <div
              className="h-full bg-[#6B7A3A] transition-all duration-300"
              style={{ width: `${station.health.dca}%` }}
              title={`[DCA] Dead Coral with Algae: ${station.health.dca}%`}
            />
          </div>

          {/* Quantitative Breakdown Legend Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-[#C0C8CC]/50 py-0.5">
              <span className="flex items-center gap-1.5 text-[#1D1C13]">
                <span className="w-2 h-2 bg-[#F2637A] inline-block" />
                <span>LC Living</span>
              </span>
              <span className="font-semibold tabular-nums">
                {station.health.lc}%
              </span>
            </div>

            <div
              className={`flex items-center justify-between border-b border-[#C0C8CC]/50 py-0.5 px-1 ${
                station.health.pb > 25 ? 'bg-[#E8A93C]/15 font-semibold' : ''
              }`}
            >
              <span className="flex items-center gap-1.5 text-[#1D1C13]">
                <span className="w-2 h-2 bg-[#E8A93C] inline-block" />
                <span>PB Bleached</span>
              </span>
              <span className="font-bold tabular-nums text-[#1D1C13]">
                {station.health.pb}%
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#C0C8CC]/50 py-0.5">
              <span className="flex items-center gap-1.5 text-[#1D1C13]">
                <span className="w-2 h-2 bg-[#8B8378] inline-block" />
                <span>DC Dead</span>
              </span>
              <span className="font-semibold tabular-nums">
                {station.health.dc}%
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#C0C8CC]/50 py-0.5">
              <span className="flex items-center gap-1.5 text-[#1D1C13]">
                <span className="w-2 h-2 bg-[#6B7A3A] inline-block" />
                <span>DCA Algae</span>
              </span>
              <span className="font-semibold tabular-nums">
                {station.health.dca}%
              </span>
            </div>
          </div>
        </div>

        {/* Interactive HUD Action Commands */}
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            id="btn-review-quadrats"
            onClick={onOpenTriage}
            className="w-full h-8 bg-[#00475A] hover:bg-[#16232E] text-[#FAF8F3] font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 border border-[#16232E] transition-colors cursor-pointer shadow-[1px_1px_0px_#16232E]"
            type="button"
          >
            <span>Review {station.quadratsCount} Quadrats in Triage Queue</span>
            <ArrowRight size={13} />
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="btn-station-detail"
              onClick={onOpenDetail}
              className="h-7 bg-[#FEF9EB] hover:bg-[#F3EEDF] border border-[#16232E] text-[#1D1C13] font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
              type="button"
            >
              <BarChart3 size={12} className="text-[#1E5F74]" />
              <span>Station Detail</span>
            </button>
            <button
              id="btn-past-transects"
              onClick={onOpenPastTransects}
              className="h-7 bg-[#FEF9EB] hover:bg-[#F3EEDF] border border-[#16232E] text-[#1D1C13] font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
              type="button"
            >
              <History size={12} className="text-[#1E5F74]" />
              <span>Past Transects</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
