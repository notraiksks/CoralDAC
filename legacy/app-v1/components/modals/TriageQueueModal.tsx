import React, { useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { StationData, QuadratRecord } from '../../types';

interface TriageQueueModalProps {
  station: StationData;
  isOpen: boolean;
  onClose: () => void;
}

export const TriageQueueModal: React.FC<TriageQueueModalProps> = ({
  station,
  isOpen,
  onClose,
}) => {
  const [quadrats, setQuadrats] = useState<QuadratRecord[]>(station.quadrats);
  const [selectedQuadrat, setSelectedQuadrat] = useState<QuadratRecord>(
    station.quadrats[0]
  );

  if (!isOpen) return null;

  const handleUpdateStatus = (
    id: string,
    status: 'VERIFIED' | 'NEEDS_REVIEW' | 'FLAGGED'
  ) => {
    setQuadrats((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    );
    setSelectedQuadrat((prev) =>
      prev.id === id ? { ...prev, status } : prev
    );
  };

  return (
    <div
      id="triage-queue-modal-overlay"
      className="fixed inset-0 z-50 bg-[#16232E]/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="triage-queue-dialog"
        className="w-full max-w-4xl max-h-[90vh] bg-[#FAF8F3] border-2 border-[#16232E] shadow-[6px_6px_0px_#16232E] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#00475A] text-[#FAF8F3] px-5 py-3 flex items-center justify-between border-b-2 border-[#16232E]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-[#F2637A] inline-block" />
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase tracking-widest text-[#9CD7EF]">
                ARCHIVAL SPECIMEN TRIAGE QUEUE // ResNet50 BENTHIC STAGE
              </span>
              <h2 className="font-serif text-lg font-bold">
                {station.id} — {station.name} ({station.transect})
              </h2>
            </div>
          </div>
          <button
            id="btn-close-triage-modal"
            onClick={onClose}
            className="text-[#FAF8F3] hover:text-[#9CD7EF] transition-colors p-1 cursor-pointer"
            title="Close Dialog"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#C0C8CC]">
          {/* Left Column: Quadrat Ledger List (5 cols) */}
          <div className="md:col-span-5 overflow-y-auto p-3 flex flex-col gap-2 max-h-[60vh] md:max-h-full">
            <div className="font-mono text-[10px] uppercase text-[#53606D] px-1 flex justify-between">
              <span>Quadrat Identification</span>
              <span>AI Conf / Status</span>
            </div>

            {quadrats.map((q) => {
              const isSelected = selectedQuadrat?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuadrat(q)}
                  type="button"
                  className={`w-full text-left p-2.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EDE8DA] border-[#16232E] shadow-[2px_2px_0px_#16232E]'
                      : 'bg-[#FEF9EB] border-[#C0C8CC] hover:bg-[#F3EEDF]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-[#00475A]">
                      QUADRAT #{q.quadratNumber}
                    </span>
                    <span
                      className={`font-mono text-[9px] px-1 py-0.2 font-semibold uppercase ${
                        q.status === 'VERIFIED'
                          ? 'bg-[#39460B] text-white'
                          : q.status === 'FLAGGED'
                          ? 'bg-[#BA1A1A] text-white'
                          : 'bg-[#E8A93C] text-[#1D1C13]'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-[#53606D] mt-1">
                    {q.dominantClass}
                  </div>

                  {/* Micro health breakdown bar */}
                  <div className="w-full h-1.5 bg-[#C0C8CC] mt-2 flex">
                    <div
                      style={{ width: `${q.coverLC}%` }}
                      className="h-full bg-[#F2637A]"
                    />
                    <div
                      style={{ width: `${q.coverPB}%` }}
                      className="h-full bg-[#E8A93C]"
                    />
                    <div
                      style={{ width: `${q.coverDC}%` }}
                      className="h-full bg-[#8B8378]"
                    />
                    <div
                      style={{ width: `${q.coverDCA}%` }}
                      className="h-full bg-[#6B7A3A]"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Specimen Inspection Plate (7 cols) */}
          <div className="md:col-span-7 p-4 overflow-y-auto flex flex-col gap-3.5 bg-[#FAF8F3]">
            {selectedQuadrat && (
              <>
                {/* Visual Specimen Plate Simulation */}
                <div className="relative w-full h-56 bg-[#16232E] border border-[#16232E] overflow-hidden flex flex-col justify-between p-3 select-none">
                  {/* Underwater Texture & Grid Overlay */}
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: `radial-gradient(circle, #FAF8F3 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Synthetic Point-Intercept Nodes */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/3 border border-[#F2637A] bg-[#F2637A]/20 p-1 font-mono text-[9px] text-white">
                      [LC] Living Coral ({selectedQuadrat.coverLC}%)
                    </div>
                    <div className="absolute top-1/2 right-1/4 border border-[#E8A93C] bg-[#E8A93C]/20 p-1 font-mono text-[9px] text-white">
                      [PB] Pale / Bleached ({selectedQuadrat.coverPB}%)
                    </div>
                    <div className="absolute bottom-1/4 left-1/4 border border-[#6B7A3A] bg-[#6B7A3A]/20 p-1 font-mono text-[9px] text-white">
                      [DCA] Dead Coral with Algae ({selectedQuadrat.coverDCA}%)
                    </div>
                  </div>

                  {/* Plate Header Overlay */}
                  <div className="relative z-10 flex justify-between items-start font-mono text-[10px] text-[#BAC8D7]">
                    <div>
                      <div>SPECIMEN_ID: {selectedQuadrat.id}</div>
                    </div>
                    <div className="bg-[#1E5F74] text-white px-2 py-0.5">
                      CONFIDENCE: {(selectedQuadrat.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Plate Footer Stamp */}
                  <div className="relative z-10 flex justify-between items-end font-mono text-[9px] text-[#FAF8F3]/70">
                    <span>
                      SURVEY UNIT: Photo-Quadrat Frame (1m²)
                    </span>
                    <span>{selectedQuadrat.timestamp}</span>
                  </div>
                </div>

                {/* Quantitative Coverage Values */}
                <div className="bg-[#FEF9EB] border border-[#C0C8CC] p-3">
                  <div className="font-mono text-[10px] uppercase text-[#53606D] mb-1.5 font-bold">
                    Point-Intercept Benthic Coverage
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-1 bg-[#F2637A]/15 border border-[#F2637A]">
                      <div className="text-[9px] text-[#53606D]">LC (Living)</div>
                      <div className="font-bold text-[#1D1C13]">
                        {selectedQuadrat.coverLC}%
                      </div>
                    </div>
                    <div className="p-1 bg-[#E8A93C]/15 border border-[#E8A93C]">
                      <div className="text-[9px] text-[#53606D]">PB (Bleached)</div>
                      <div className="font-bold text-[#1D1C13]">
                        {selectedQuadrat.coverPB}%
                      </div>
                    </div>
                    <div className="p-1 bg-[#8B8378]/15 border border-[#8B8378]">
                      <div className="text-[9px] text-[#53606D]">DC (Dead)</div>
                      <div className="font-bold text-[#1D1C13]">
                        {selectedQuadrat.coverDC}%
                      </div>
                    </div>
                    <div className="p-1 bg-[#6B7A3A]/15 border border-[#6B7A3A]">
                      <div className="text-[9px] text-[#53606D]">DCA (Algae)</div>
                      <div className="font-bold text-[#1D1C13]">
                        {selectedQuadrat.coverDCA}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Triage Decision Buttons */}
                <div className="flex gap-2 pt-2 border-t border-[#C0C8CC]">
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedQuadrat.id, 'VERIFIED')
                    }
                    className="flex-1 h-8 bg-[#39460B] hover:bg-[#1D1C13] text-white font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#16232E]"
                    type="button"
                  >
                    <Check size={14} />
                    <span>Verify Classification</span>
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedQuadrat.id, 'FLAGGED')
                    }
                    className="flex-1 h-8 bg-[#BA1A1A] hover:bg-[#1D1C13] text-white font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#16232E]"
                    type="button"
                  >
                    <AlertTriangle size={14} />
                    <span>Flag Anomaly</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
