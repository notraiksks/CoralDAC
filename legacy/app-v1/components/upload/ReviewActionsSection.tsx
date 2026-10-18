import React, { useState } from 'react';
import { ShieldCheck, Send, RotateCcw, ArrowLeft, CheckCheck, Loader2 } from 'lucide-react';

interface ReviewActionsSectionProps {
  onBackToLocation?: () => void;
  onStartOver?: () => void;
}

export const ReviewActionsSection: React.FC<ReviewActionsSectionProps> = ({
  onBackToLocation,
  onStartOver,
}) => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'enqueued'>('idle');

  const handleSubmit = () => {
    if (status !== 'idle') return;
    setStatus('submitting');
    setTimeout(() => setStatus('enqueued'), 800);
  };

  const handleReset = () => {
    setStatus('idle');
    onStartOver?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="reef-r-lg p-3.5 bg-white/5 border border-[color:var(--color-reef-line)] flex items-start gap-3">
        <ShieldCheck className="text-[color:var(--color-reef-shallow-2)] shrink-0 mt-0.5" size={18} />
        <p className="text-[12px] text-[color:var(--color-reef-sand-dim)] leading-relaxed">
          Boxes detected by <strong className="text-[color:var(--color-reef-sand)] font-medium">YOLOv8</strong>,
          health classified by <strong className="text-[color:var(--color-reef-sand)] font-medium">ResNet50</strong>.
          A curator verifies before this record is finalized.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status !== 'idle'}
          className={`reef-r-lg w-full py-3 px-6 text-[13px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            status === 'enqueued'
              ? 'bg-[color:var(--color-reef-dca)] text-white'
              : 'bg-[color:var(--color-reef-shallow-2)] text-[#08191d] hover:brightness-110'
          }`}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="animate-spin" size={17} />
              Submitting survey record...
            </>
          ) : status === 'enqueued' ? (
            <>
              <CheckCheck size={17} />
              Sent to curation queue
            </>
          ) : (
            <>
              <Send size={17} />
              Submit for review
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="reef-r-lg w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-[color:var(--color-reef-sand)] text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            Start over
          </button>
          <button
            type="button"
            onClick={onBackToLocation}
            className="reef-r-lg w-full py-2.5 px-3 bg-transparent border border-[color:var(--color-reef-line)] hover:bg-white/5 text-[color:var(--color-reef-sand-dim)] text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to location
          </button>
        </div>
      </div>
    </div>
  );
};
