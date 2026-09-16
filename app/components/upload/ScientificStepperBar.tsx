import React from 'react';

interface ScientificStepperBarProps {
  onStepClick?: (step: number) => void;
}

export const ScientificStepperBar: React.FC<ScientificStepperBarProps> = ({
  onStepClick,
}) => {
  return (
    <section
      id="scientific-stepper-bar"
      className="w-full bg-[#F9F3E5] border-b border-[#D1CBBF] px-6 py-2 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 font-mono text-[11px] uppercase">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => onStepClick?.(1)}
          className="flex items-center gap-2 text-[#1D1C13] hover:opacity-80 transition-opacity"
        >
          <span className="w-5 h-5 flex items-center justify-center bg-[#00475A] text-white font-bold text-[11px]">
            ✓
          </span>
          <span className="font-semibold text-[#1D1C13]">01 Photo Ingest</span>
          <span className="text-[#53606D] font-normal text-[10px] hidden sm:inline">
            [UPLOADED]
          </span>
        </button>

        <div className="hidden md:block flex-1 mx-4 h-[1px] bg-[#D1CBBF]" />

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => onStepClick?.(2)}
          className="flex items-center gap-2 text-[#1D1C13] hover:opacity-80 transition-opacity"
        >
          <span className="w-5 h-5 flex items-center justify-center bg-[#00475A] text-white font-bold text-[11px]">
            ✓
          </span>
          <span className="font-semibold text-[#1D1C13]">02 Station Reference</span>
          <span className="text-[#53606D] font-normal text-[10px] hidden sm:inline">
            [ASSIGNED]
          </span>
        </button>

        <div className="hidden md:block flex-1 mx-4 h-[1px] bg-[#00475A]" />

        {/* Step 3 (Active) */}
        <div
          id="stepper-step-3-active"
          className="flex items-center gap-2 bg-[#1E5F74] text-white px-3 py-1 border border-[#00475A]"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-[#FAF8F3] animate-pulse" />
          <span className="font-bold tracking-wider">
            03 Preview (Provisional Results)
          </span>
          <span className="text-[#9CD7EF] text-[10px] font-mono hidden sm:inline">
            [INSPECTION]
          </span>
        </div>

        <div className="hidden md:block flex-1 mx-4 h-[1px] bg-[#D1CBBF]" />

        {/* Step 4 */}
        <div className="flex items-center gap-2 text-[#70787C]">
          <span className="w-5 h-5 flex items-center justify-center border border-[#70787C] text-[#70787C] font-medium text-[11px]">
            4
          </span>
          <span>04 Submit to Queue</span>
          <span className="text-[#53606D] text-[10px] hidden sm:inline">
            [PENDING]
          </span>
        </div>
      </div>
    </section>
  );
};
