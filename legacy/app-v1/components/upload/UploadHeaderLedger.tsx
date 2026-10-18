import React from 'react';
import { Camera } from 'lucide-react';

export const UploadHeaderLedger: React.FC = () => {
  return (
    <section className="w-full bg-[color:var(--color-reef-deep)] border-b border-[color:var(--color-reef-line)] px-6 py-4 flex flex-wrap items-center justify-between gap-3 select-none">
      <div>
        <span className="text-[11px] text-[color:var(--color-reef-sand-dim)]">
          Survey ingestion
        </span>
        <h1 className="text-2xl font-semibold text-[color:var(--color-reef-sand)] tracking-tight mt-0.5">
          Upload a survey image
        </h1>
      </div>

      <div className="reef-r-full flex items-center gap-1.5 text-[12px] text-[color:var(--color-reef-sand-dim)] bg-white/5 px-3 py-1.5 border border-[color:var(--color-reef-line)]">
        <Camera size={13} className="text-[color:var(--color-reef-shallow-2)]" />
        <span>1m² benthic quadrat</span>
      </div>
    </section>
  );
};
