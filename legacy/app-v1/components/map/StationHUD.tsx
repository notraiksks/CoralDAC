import React from 'react';
import { X, ArrowRight, BarChart3, History } from 'lucide-react';
import { StationData } from '../../types';

interface StationHUDProps {
  station: StationData;
  isOpen: boolean;
  onClose: () => void;
  onOpenTriage: () => void;
  onOpenDetail: () => void;
  onOpenPastTransects: () => void;
}

const CLASS_ROWS: { key: 'lc' | 'pb' | 'dc' | 'dca'; label: string; color: string }[] = [
  { key: 'lc', label: 'Living coral', color: 'var(--color-reef-lc)' },
  { key: 'pb', label: 'Partially bleached', color: 'var(--color-reef-pb)' },
  { key: 'dc', label: 'Dead coral', color: 'var(--color-reef-dc)' },
  { key: 'dca', label: 'Dead coral, algae', color: 'var(--color-reef-dca)' },
];

// Right-edge slide-in drawer for a single station, styled after the
// `.drawer` panel in the ui.zip reference (scrim + translateX panel).
export const StationHUD: React.FC<StationHUDProps> = ({
  station,
  isOpen,
  onClose,
  onOpenTriage,
  onOpenDetail,
  onOpenPastTransects,
}) => {
  const meanConfidence =
    station.quadrats.length > 0
      ? station.quadrats.reduce((sum, q) => sum + q.confidence, 0) / station.quadrats.length
      : null;

  return (
    <>
      {/* Scrim */}
      <div
        className={`absolute inset-0 z-[39] bg-[#051418] transition-opacity duration-300 ${
          isOpen ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        aria-hidden={!isOpen}
        className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[360px] flex flex-col bg-gradient-to-b from-[#0F3138] to-[#0A2830] border-l border-[color:var(--color-reef-line)] shadow-2xl transition-transform duration-[400ms] ease-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="px-5 pt-5 pb-3.5 border-b border-[color:var(--color-reef-line)]">
          <button
            onClick={onClose}
            className="text-[12.5px] text-[color:var(--color-reef-sand-dim)] hover:text-[color:var(--color-reef-sand)] mb-3 cursor-pointer flex items-center gap-1"
            type="button"
          >
            <X size={13} /> Close
          </button>
          <h2 className="font-reef-display text-[18px] font-semibold text-[color:var(--color-reef-sand)] leading-snug">
            {station.name}
          </h2>
          <p className="text-[12px] text-[color:var(--color-reef-sand-dim)] mt-1">
            {station.coordinates} · {station.depth}m depth · {station.quadratsCount} quadrat images
          </p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          {meanConfidence !== null && (
            <div className="flex items-center justify-between text-[11.5px] text-[color:var(--color-reef-sand-dim)]">
              <span>Mean ResNet50 confidence</span>
              <span className="text-[color:var(--color-reef-sand)] font-medium tabular-nums">
                {meanConfidence.toFixed(2)}
              </span>
            </div>
          )}

          <div className="reef-r-md w-full h-3 flex overflow-hidden bg-white/5">
            {CLASS_ROWS.map((c) => (
              <div
                key={c.key}
                className="h-full"
                style={{ width: `${station.health[c.key]}%`, background: c.color }}
                title={`${c.label}: ${station.health[c.key]}%`}
              />
            ))}
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-wide text-[color:var(--color-reef-sand-dim)] mb-2">
              Class counts, this station
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {CLASS_ROWS.map((c) => (
                <div
                  key={c.key}
                  className="reef-r-md flex items-center justify-between gap-2 px-2.5 py-2 bg-white/5"
                >
                  <span className="flex items-center gap-1.5 text-[12px] text-[color:var(--color-reef-sand)]">
                    <span className="w-2 h-2 reef-r-full inline-block flex-shrink-0" style={{ background: c.color }} />
                    {c.label}
                  </span>
                  <span className="text-[12px] text-[color:var(--color-reef-sand-dim)] tabular-nums">
                    {station.health[c.key]}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-wide text-[color:var(--color-reef-sand-dim)] mb-2">
              Quadrat images
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {station.quadrats.map((q) => (
                <div
                  key={q.id}
                  className="reef-r-md relative aspect-square"
                  style={{
                    background:
                      'repeating-radial-gradient(circle at 30% 30%, rgba(255,111,77,.33), rgba(255,111,77,.13) 6px, rgba(10,40,48,.6) 7px, rgba(10,40,48,.6) 13px)',
                    boxShadow: 'inset 0 0 0 1px var(--color-reef-line)',
                  }}
                  title={`${q.id} · confidence ${q.confidence.toFixed(2)}`}
                >
                  <span className="absolute left-1 bottom-1 text-[9px] px-1 py-0.5 rounded-[4px] bg-[#081a1f]/75 text-[color:var(--color-reef-sand)]">
                    {q.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[color:var(--color-reef-line)] flex flex-col gap-1.5">
          <button
            onClick={onOpenTriage}
            className="reef-r-md w-full h-10 bg-[color:var(--color-reef-accent)] hover:brightness-110 text-[#1A0D08] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            type="button"
          >
            Review in triage queue
            <ArrowRight size={13} />
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onOpenDetail}
              className="reef-r-md h-9 bg-white/5 hover:bg-white/10 text-[color:var(--color-reef-sand)] text-[11.5px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              type="button"
            >
              <BarChart3 size={13} />
              Station detail
            </button>
            <button
              onClick={onOpenPastTransects}
              className="reef-r-md h-9 bg-white/5 hover:bg-white/10 text-[color:var(--color-reef-sand)] text-[11.5px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              type="button"
            >
              <History size={13} />
              Past transects
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
