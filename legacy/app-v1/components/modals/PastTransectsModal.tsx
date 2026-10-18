import React from 'react';
import { X, History, Calendar, Thermometer, Waves, CheckCircle2 } from 'lucide-react';
import { StationData } from '../../types';

interface PastTransectsModalProps {
  station: StationData;
  isOpen: boolean;
  onClose: () => void;
}

export const PastTransectsModal: React.FC<PastTransectsModalProps> = ({
  station,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="past-transects-modal-overlay"
      className="fixed inset-0 z-50 bg-[#16232E]/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="past-transects-dialog"
        className="w-full max-w-3xl bg-[#FAF8F3] border-2 border-[#16232E] shadow-[6px_6px_0px_#16232E] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#00475A] text-[#FAF8F3] px-5 py-3 flex items-center justify-between border-b-2 border-[#16232E]">
          <div className="flex items-center gap-3">
            <History size={18} className="text-[#9CD7EF]" />
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#9CD7EF]">
                HISTORICAL TRANSECT ARCHIVE
              </span>
              <h2 className="font-serif text-lg font-bold">
                {station.id} — Historical Survey Passes
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
          <p className="font-sans text-xs text-[#53606D] italic">
            Chronological multi-season reef monitoring logs recorded via SCUBA photo-quadrat transect protocol at {station.name}.
          </p>

          <div className="flex flex-col gap-3">
            {station.pastTransects.map((pt, idx) => (
              <div
                key={pt.id}
                className="bg-[#FEF9EB] border border-[#16232E] p-4 flex flex-col gap-2 shadow-[2px_2px_0px_#16232E]"
              >
                <div className="flex justify-between items-start border-b border-[#C0C8CC] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#00475A]">
                      {pt.code}
                    </span>
                    {idx === 0 && (
                      <span className="font-mono text-[9px] bg-[#BA1A1A] text-white px-1.5 py-0.2 font-bold uppercase">
                        CURRENT CRUISE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#1D1C13]">
                    <Calendar size={13} className="text-[#53606D]" />
                    <span>{pt.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs text-[#1D1C13] pt-1">
                  <div className="flex flex-col">
                    <span className="text-[#53606D] text-[10px]">SURVEY METHOD</span>
                    <span className="font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[#00475A]" />
                      Photo-Quadrat Line
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[#53606D] text-[10px]">SURVEY TEMP</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Thermometer size={12} className="text-[#BA1A1A]" />
                      {pt.waterTemp}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[#53606D] text-[10px]">VISIBILITY</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Waves size={12} className="text-[#1E5F74]" />
                      {pt.visibility}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[#53606D] text-[10px]">BLEACHED COVER (PB)</span>
                    <span className="font-bold text-[#E8A93C]">
                      {pt.bleachedCover}
                    </span>
                  </div>
                </div>

                <div className="font-sans text-xs text-[#53606D] mt-1 pt-1 border-t border-[#EDE8DA] flex justify-between">
                  <span>Primary Benthic Class: <strong className="font-mono text-[#1D1C13]">{pt.primaryClass}</strong></span>
                  <span className="font-mono text-[10px]">{pt.quadratsCount} Benthic Quadrats</span>
                </div>
              </div>
            ))}
          </div>

          {/* Close action */}
          <div className="flex justify-end pt-2 border-t border-[#C0C8CC]">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#FEF9EB] text-[#1D1C13] font-mono text-xs uppercase tracking-wider border border-[#16232E] hover:bg-[#F3EEDF] transition-colors cursor-pointer"
              type="button"
            >
              Close Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
