import React from 'react';
import { Check } from 'lucide-react';

interface ScientificStepperBarProps {
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { n: 1, label: 'Photo ingest' },
  { n: 2, label: 'Station reference' },
  { n: 3, label: 'Preview results' },
  { n: 4, label: 'Submit to queue' },
];

export const ScientificStepperBar: React.FC<ScientificStepperBarProps> = ({
  onStepClick,
}) => {
  const currentStep = 3;

  return (
    <section className="w-full bg-[color:var(--color-reef-mid)] border-b border-[color:var(--color-reef-line)] px-6 py-3 select-none">
      <div className="max-w-6xl mx-auto flex items-center">
        {STEPS.map((step, i) => {
          const done = step.n < currentStep;
          const active = step.n === currentStep;
          return (
            <React.Fragment key={step.n}>
              <button
                type="button"
                onClick={() => onStepClick?.(step.n)}
                disabled={step.n > currentStep}
                className={`flex items-center gap-2 text-[12.5px] transition-opacity ${
                  step.n > currentStep ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                }`}
              >
                <span
                  className={`reef-r-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    done
                      ? 'bg-[color:var(--color-reef-shallow-2)] text-[#08191d]'
                      : active
                      ? 'bg-[color:var(--color-reef-sand)] text-[color:var(--color-reef-deep)]'
                      : 'border border-[color:var(--color-reef-line)] text-[color:var(--color-reef-sand-dim)]'
                  }`}
                >
                  {done ? <Check size={12} /> : step.n}
                </span>
                <span
                  className={
                    active
                      ? 'text-[color:var(--color-reef-sand)] font-semibold'
                      : 'text-[color:var(--color-reef-sand-dim)]'
                  }
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-[1px] mx-3 ${
                    done ? 'bg-[color:var(--color-reef-shallow-2)]' : 'bg-[color:var(--color-reef-line)]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
