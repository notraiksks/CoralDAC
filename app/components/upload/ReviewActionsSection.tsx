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
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'enqueued'>('idle');

  const handleSubmit = () => {
    if (submissionStatus !== 'idle') return;
    setSubmissionStatus('submitting');
    setTimeout(() => {
      setSubmissionStatus('enqueued');
    }, 800);
  };

  const handleReset = () => {
    setSubmissionStatus('idle');
    onStartOver?.();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Scientific Integrity Callout Banner */}
      <div
        id="scientific-integrity-banner"
        className="p-3.5 bg-[#D3E1F0]/40 border border-[#1E5F74] text-[#576471] flex items-start gap-3"
      >
        <ShieldCheck className="text-[#1E5F74] shrink-0 mt-0.5" size={20} />
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase font-bold text-[#1E5F74]">
            Review Pipeline Notice
          </span>
          <p className="font-sans text-xs text-[#40484C] mt-1 leading-snug">
            Notice: Provisional bounding boxes detected by{' '}
            <strong className="text-[#1D1C13] font-semibold">YOLOv8</strong>; health status
            classified by{' '}
            <strong className="text-[#1D1C13] font-semibold">ResNet50</strong>. A
            human curator will verify and confirm before this record is finalized.
          </p>
        </div>
      </div>

      {/* Review Action Button Group */}
      <div className="flex flex-col gap-2 pt-1">
        {/* Primary: Submit for review */}
        <button
          id="submit-review-btn"
          type="button"
          onClick={handleSubmit}
          disabled={submissionStatus !== 'idle'}
          className={`w-full py-3 px-6 font-mono text-xs uppercase font-medium border border-[#16232E] transition-all flex items-center justify-center gap-2 ${
            submissionStatus === 'enqueued'
              ? 'bg-[#505E21] text-[#FFFFFF] border-[#39460B]'
              : submissionStatus === 'submitting'
              ? 'bg-[#1E5F74] text-[#FFFFFF] opacity-90 cursor-wait'
              : 'bg-[#1E5F74] text-[#FFFFFF] hover:bg-[#16232E]'
          }`}
        >
          {submissionStatus === 'submitting' ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Submitting Survey Record...</span>
            </>
          ) : submissionStatus === 'enqueued' ? (
            <>
              <CheckCheck size={18} />
              <span>Enqueued for Curation Review!</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Submit for review</span>
            </>
          )}
        </button>

        {/* Secondary Row: Start Over & Back */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="btn-start-over"
            onClick={handleReset}
            className="w-full py-2.5 px-3 bg-transparent text-[#1D1C13] font-mono text-xs uppercase border border-[#16232E] hover:bg-[#E7E2D4] transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={15} />
            <span>Start over</span>
          </button>

          <button
            type="button"
            id="btn-back-location"
            onClick={onBackToLocation}
            className="w-full py-2.5 px-3 bg-transparent text-[#00475A] font-mono text-xs uppercase border border-[#D1CBBF] hover:bg-[#F3EEDF] transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft size={15} />
            <span>[Back to Location]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
