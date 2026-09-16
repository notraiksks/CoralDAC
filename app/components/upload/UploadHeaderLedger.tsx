import React from 'react';
import { Camera } from 'lucide-react';

export const UploadHeaderLedger: React.FC = () => {
  return (
    <section
      id="upload-header-ledger"
      className="w-full bg-[#EDE8DA] border-b border-[#D1CBBF] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 select-none"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[#1E5F74] font-semibold">
            SURVEY INGESTION
          </span>
          <span className="text-[#70787C]">/</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#53606D]">
            IMAGE ANALYSIS PIPELINE
          </span>
        </div>
        <h1 className="font-serif text-2xl text-[#1D1C13] tracking-tight mt-0.5 font-bold">
          Upload a Survey Image
        </h1>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#53606D] bg-[#FEF9EB] px-3 py-1 border border-[#D1CBBF]">
          <Camera size={14} className="text-[#00475A]" />
          <span>FORMAT: 1m² BENTHIC QUADRAT</span>
        </div>
      </div>
    </section>
  );
};
