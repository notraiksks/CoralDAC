import React from 'react';
import { Sliders } from 'lucide-react';

interface SubHeaderBarProps {
  onToggleFilterMode: () => void;
}

export const SubHeaderBar: React.FC<SubHeaderBarProps> = ({
  onToggleFilterMode,
}) => {
  return (
    <div
      id="subheader-context-bar"
      className="w-full bg-[#FAF8F3] border-b border-[#C0C8CC] px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 z-20"
    >
      {/* Title & Geospatial Sector Identification */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-baseline gap-2.5">
          <h1
            id="page-main-heading"
            className="font-serif text-2xl text-[#1D1C13] tracking-tight font-normal"
          >
            Reef Health Map
          </h1>
        </div>
      </div>

      {/* Global Toolbar Commands */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-[#53606D] hidden md:inline">
          5 TRANSECTS · 420 QUADRATS
        </span>

        <button
          id="btn-filter-mode"
          onClick={onToggleFilterMode}
          className="px-3 py-1.5 bg-[#FEF9EB] border border-[#16232E] font-mono text-[11px] text-[#1D1C13] hover:bg-[#F3EEDF] transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_#16232E]"
          type="button"
        >
          <Sliders size={13} className="text-[#00475A]" />
          <span>Filter Mode</span>
        </button>
      </div>
    </div>
  );
};

