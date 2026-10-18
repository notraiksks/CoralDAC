import React from 'react';
import { X, Activity, Camera, FileText, CheckCircle2 } from 'lucide-react';
import { StationData } from '../../types';

interface StationDetailModalProps {
  station: StationData;
  isOpen: boolean;
  onClose: () => void;
  onOpenTriage: () => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  isOpen,
  onClose,
  onOpenTriage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="station-detail-modal-overlay"
      className="fixed inset-0 z-50 bg-[#16232E]/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="station-detail-dialog"
        className="w-full max-w-3xl bg-[#FAF8F3] border-2 border-[#16232E] shadow-[6px_6px_0px_#16232E] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#00475A] text-[#FAF8F3] px-5 py-3 flex items-center justify-between border-b-2 border-[#16232E]">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-[#9CD7EF]" />
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#9CD7EF]">
                STATION SURVEY DOSSIER
              </span>
              <h2 className="font-serif text-lg font-bold">
                {station.id} — {station.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#FAF8F3] hover:text-[#9CD7EF] transition-colors p-1 cursor-pointer"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Key Geodetic Coordinates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#FEF9EB] border border-[#C0C8CC] p-3 font-mono text-xs">
            <div>
              <span className="text-[#53606D] text-[10px] block">COORDINATES</span>
              <span className="font-bold text-[#1D1C13]">{station.coordinates}</span>
            </div>
            <div>
              <span className="text-[#53606D] text-[10px] block">SOUNDING DEPTH</span>
              <span className="font-bold text-[#1D1C13]">{station.depth} m</span>
            </div>
            <div>
              <span className="text-[#53606D] text-[10px] block">ACTIVE TRANSECT</span>
              <span className="font-bold text-[#1D1C13]">{station.transect}</span>
            </div>
            <div>
              <span className="text-[#53606D] text-[10px] block">CLASSIFIER MODEL</span>
              <span className="font-bold text-[#00475A] uppercase">
                ResNet50 Stage
              </span>
            </div>
          </div>

          {/* Survey Transect Specifications */}
          <div>
            <h3 className="font-mono text-xs uppercase font-bold text-[#00475A] mb-2 tracking-wider">
              Survey Transect Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#FAF8F3] border border-[#16232E] p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#53606D] font-mono text-[10px]">
                  <Camera size={14} className="text-[#00475A]" />
                  <span>QUADRATS SAMPLED</span>
                </div>
                <div className="font-mono text-xl font-bold text-[#1D1C13]">
                  {station.quadratsCount} Units
                </div>
                <span className="text-[10px] text-[#53606D] font-mono">
                  1.0m × 1.0m Photo-quadrats
                </span>
              </div>

              <div className="bg-[#FAF8F3] border border-[#16232E] p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#53606D] font-mono text-[10px]">
                  <FileText size={14} className="text-[#00475A]" />
                  <span>TRANSECT PROTOCOL</span>
                </div>
                <div className="font-mono text-xl font-bold text-[#1D1C13]">
                  50m Line
                </div>
                <span className="text-[10px] text-[#53606D] font-mono">
                  Point-intercept method
                </span>
              </div>

              <div className="bg-[#FAF8F3] border border-[#16232E] p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#53606D] font-mono text-[10px]">
                  <CheckCircle2 size={14} className="text-[#39460B]" />
                  <span>CLASSIFIER STAGE</span>
                </div>
                <div className="font-mono text-xl font-bold text-[#1D1C13]">
                  ResNet50
                </div>
                <span className="text-[10px] text-[#39460B] font-mono">
                  Benthic health classification
                </span>
              </div>

              <div className="bg-[#FAF8F3] border border-[#16232E] p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#53606D] font-mono text-[10px]">
                  <Activity size={14} className="text-[#53606D]" />
                  <span>PRIMARY CONDITION</span>
                </div>
                <div className="font-mono text-xl font-bold text-[#1D1C13]">
                  {station.health.pb > 30 ? 'Bleached' : station.health.lc >= 40 ? 'Living Coral' : 'Mixed Benthic'}
                </div>
                <span className="text-[10px] text-[#53606D] font-mono">
                  Four-class health evaluation
                </span>
              </div>
            </div>
          </div>

          {/* Benthic Community Composition */}
          <div className="bg-[#FEF9EB] border border-[#C0C8CC] p-4">
            <h3 className="font-mono text-xs uppercase font-bold text-[#00475A] mb-2 tracking-wider">
              Benthic Health Ratio Breakdown (ResNet50 Stage)
            </h3>
            <div className="w-full h-5 bg-[#EDE8DA] border border-[#16232E] flex overflow-hidden mb-3">
              <div
                style={{ width: `${station.health.lc}%` }}
                className="h-full bg-[#F2637A] border-r border-[#16232E]"
                title={`LC: ${station.health.lc}%`}
              />
              <div
                style={{ width: `${station.health.pb}%` }}
                className="h-full bg-[#E8A93C] border-r border-[#16232E]"
                title={`PB: ${station.health.pb}%`}
              />
              <div
                style={{ width: `${station.health.dc}%` }}
                className="h-full bg-[#8B8378] border-r border-[#16232E]"
                title={`DC: ${station.health.dc}%`}
              />
              <div
                style={{ width: `${station.health.dca}%` }}
                className="h-full bg-[#6B7A3A]"
                title={`DCA: ${station.health.dca}%`}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-2 border border-[#F2637A] bg-[#F2637A]/10">
                <div className="font-bold text-[#1D1C13]">[LC] Living Coral</div>
                <div className="text-base font-extrabold">{station.health.lc}%</div>
                <div className="text-[10px] text-[#53606D]">Photosynthetic biomass</div>
              </div>
              <div className="p-2 border border-[#E8A93C] bg-[#E8A93C]/10">
                <div className="font-bold text-[#1D1C13]">[PB] Bleached</div>
                <div className="text-base font-extrabold">{station.health.pb}%</div>
                <div className="text-[10px] text-[#53606D]">Loss of pigmentation</div>
              </div>
              <div className="p-2 border border-[#8B8378] bg-[#8B8378]/10">
                <div className="font-bold text-[#1D1C13]">[DC] Dead Skeleton</div>
                <div className="text-base font-extrabold">{station.health.dc}%</div>
                <div className="text-[10px] text-[#53606D]">Exposed aragonite</div>
              </div>
              <div className="p-2 border border-[#6B7A3A] bg-[#6B7A3A]/10">
                <div className="font-bold text-[#1D1C13]">[DCA] Dead Coral + Algae</div>
                <div className="text-base font-extrabold">{station.health.dca}%</div>
                <div className="text-[10px] text-[#53606D]">Algal colonization</div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#C0C8CC]">
            <button
              onClick={() => {
                onClose();
                onOpenTriage();
              }}
              className="px-4 py-2 bg-[#00475A] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#16232E] transition-colors border border-[#16232E] cursor-pointer"
              type="button"
            >
              Open Triage Queue ({station.quadratsCount} Quadrats)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#FEF9EB] text-[#1D1C13] font-mono text-xs uppercase tracking-wider border border-[#16232E] hover:bg-[#F3EEDF] transition-colors cursor-pointer"
              type="button"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
