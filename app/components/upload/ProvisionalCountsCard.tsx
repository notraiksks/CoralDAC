import React from 'react';
import { Calculator } from 'lucide-react';

interface ProvisionalCountsCardProps {
  onSelectCategory?: (cat: 'LC' | 'PB' | 'DC' | 'DCA' | null) => void;
  selectedCategory?: string | null;
}

export const ProvisionalCountsCard: React.FC<ProvisionalCountsCardProps> = ({
  onSelectCategory,
  selectedCategory,
}) => {
  const classes = [
    {
      code: 'LC' as const,
      symbol: '●',
      symbolColor: '#F2637A',
      borderColor: '#F2637A',
      title: 'Living Coral [LC]',
      description: 'Living pigmented coral tissue',
      count: 12,
      percentage: '46.2%',
    },
    {
      code: 'PB' as const,
      symbol: '▲',
      symbolColor: '#E8A93C',
      borderColor: '#E8A93C',
      title: 'Partially Bleached [PB]',
      description: 'Partial loss of pigmentation',
      count: 6,
      percentage: '23.1%',
    },
    {
      code: 'DC' as const,
      symbol: '■',
      symbolColor: '#8B8378',
      borderColor: '#8B8378',
      title: 'Dead Coral [DC]',
      description: 'Recent mortality skeleton',
      count: 5,
      percentage: '19.2%',
    },
    {
      code: 'DCA' as const,
      symbol: '◆',
      symbolColor: '#6B7A3A',
      borderColor: '#6B7A3A',
      title: 'Dead Coral + Algae [DCA]',
      description: 'Turf and algal overgrowth',
      count: 3,
      percentage: '11.5%',
    },
  ];

  return (
    <div id="provisional-counts-card" className="bg-[#FEF9EB] border border-[#D1CBBF] flex flex-col">
      <div className="bg-[#F9F3E5] px-4 py-2 border-b border-[#D1CBBF] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calculator size={16} className="text-[#00475A]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1D1C13]">
            Provisional Health Classification
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#70787C]">
          26 DETECTIONS
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        {classes.map((cls) => {
          const isSelected = selectedCategory === cls.code;

          return (
            <div
              key={cls.code}
              id={`chip-${cls.code.toLowerCase()}`}
              onClick={() => onSelectCategory?.(isSelected ? null : cls.code)}
              style={{ borderLeftColor: cls.borderColor }}
              className={`flex items-center justify-between bg-[#F9F3E5] px-3 py-2 border-l-4 border-t border-r border-b border-[#D1CBBF] cursor-pointer hover:bg-[#F3EEDF] transition-all ${
                isSelected ? 'ring-2 ring-[#00475A]' : ''
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: cls.symbolColor }} className="font-bold text-sm">
                    {cls.symbol}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1D1C13]">
                    {cls.title}
                  </span>
                </div>
                <span className="font-sans text-xs text-[#53606D] pl-3.5">
                  {cls.description}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-[#1D1C13] text-base leading-none block">
                  {cls.count}
                </span>
                <div
                  style={{ color: cls.symbolColor }}
                  className="font-mono text-[11px] font-semibold mt-0.5"
                >
                  {cls.percentage}
                </div>
              </div>
            </div>
          );
        })}

        {/* Cumulative Class Breakdown */}
        <div className="mt-1 p-3 bg-[#F3EEDF] border border-[#D1CBBF]">
          <div className="flex items-center justify-between font-mono text-xs mb-1.5">
            <span className="text-[#1D1C13] font-semibold uppercase">
              Benthic Class Breakdown:
            </span>
            <span className="text-[#53606D]">4 Categories</span>
          </div>

          <div className="w-full h-2.5 bg-[#E7E2D4] flex overflow-hidden border border-[#D1CBBF]">
            <div
              className="bg-[#F2637A] transition-all"
              style={{ width: '46.2%' }}
              title="LC 46.2%"
            />
            <div
              className="bg-[#E8A93C] transition-all"
              style={{ width: '23.1%' }}
              title="PB 23.1%"
            />
            <div
              className="bg-[#8B8378] transition-all"
              style={{ width: '19.2%' }}
              title="DC 19.2%"
            />
            <div
              className="bg-[#6B7A3A] transition-all"
              style={{ width: '11.5%' }}
              title="DCA 11.5%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
