import React from 'react';
import { Calculator } from 'lucide-react';

interface ProvisionalCountsCardProps {
  onSelectCategory?: (cat: 'LC' | 'PB' | 'DC' | 'DCA' | null) => void;
  selectedCategory?: string | null;
}

const CLASSES = [
  { code: 'LC' as const, color: 'var(--color-reef-lc)', title: 'Living coral', description: 'Living pigmented tissue', count: 12, percentage: 46.2 },
  { code: 'PB' as const, color: 'var(--color-reef-pb)', title: 'Partially bleached', description: 'Partial pigment loss', count: 6, percentage: 23.1 },
  { code: 'DC' as const, color: 'var(--color-reef-dc)', title: 'Dead coral', description: 'Recent mortality, bare skeleton', count: 5, percentage: 19.2 },
  { code: 'DCA' as const, color: 'var(--color-reef-dca)', title: 'Dead coral, algae', description: 'Turf and algal overgrowth', count: 3, percentage: 11.5 },
];

export const ProvisionalCountsCard: React.FC<ProvisionalCountsCardProps> = ({
  onSelectCategory,
  selectedCategory,
}) => {
  const total = CLASSES.reduce((s, c) => s + c.count, 0);

  return (
    <div className="reef-r-xl bg-[color:var(--color-reef-deep)]/60 border border-[color:var(--color-reef-line)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[color:var(--color-reef-line)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calculator size={15} className="text-[color:var(--color-reef-shallow-2)]" />
          <span className="text-[13px] font-medium text-[color:var(--color-reef-sand)]">
            Provisional classification
          </span>
        </div>
        <span className="text-[10.5px] text-[color:var(--color-reef-sand-dim)]">
          {total} detections
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {CLASSES.map((cls) => {
          const isSelected = selectedCategory === cls.code;
          return (
            <button
              key={cls.code}
              type="button"
              onClick={() => onSelectCategory?.(isSelected ? null : cls.code)}
              className={`reef-r-lg flex items-center justify-between px-3 py-2.5 text-left transition-colors cursor-pointer ${
                isSelected ? 'bg-white/10' : 'bg-white/5 hover:bg-white/[0.08]'
              }`}
              style={{ boxShadow: isSelected ? `inset 0 0 0 1.5px ${cls.color}` : undefined }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="reef-r-full w-2.5 h-2.5 flex-shrink-0"
                  style={{ background: cls.color }}
                />
                <div>
                  <div className="text-[12.5px] font-medium text-[color:var(--color-reef-sand)]">
                    {cls.title}
                  </div>
                  <div className="text-[11px] text-[color:var(--color-reef-sand-dim)]">
                    {cls.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-semibold text-[color:var(--color-reef-sand)] leading-none">
                  {cls.count}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: cls.color }}>
                  {cls.percentage}%
                </div>
              </div>
            </button>
          );
        })}

        <div className="reef-r-md w-full h-2 flex overflow-hidden bg-white/5 mt-1">
          {CLASSES.map((cls) => (
            <div
              key={cls.code}
              className="h-full"
              style={{ width: `${cls.percentage}%`, background: cls.color }}
              title={`${cls.code} ${cls.percentage}%`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
