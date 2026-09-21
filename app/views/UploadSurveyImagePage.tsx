import React, { useState } from 'react';
import { StationData } from '../types';
import {
  UploadHeaderLedger,
  ScientificStepperBar,
  QuadratViewport,
  FieldNotesLedger,
  LocationIntegrityCard,
  ProvisionalCountsCard,
  ReviewActionsSection,
} from '../components/upload';

interface UploadSurveyImagePageProps {
  stations: StationData[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onNavigateToMap: () => void;
  onNavigateToSubmissions?: () => void;
  onOpenCurationQueue: () => void;
}

export const UploadSurveyImagePage: React.FC<UploadSurveyImagePageProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onNavigateToMap,
  onNavigateToSubmissions,
  onOpenCurationQueue,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'LC' | 'PB' | 'DC' | 'DCA' | null>(null);
  const [enqueuedToast, setEnqueuedToast] = useState(false);

  const handleEnqueued = () => {
    setEnqueuedToast(true);
    setTimeout(() => {
      setEnqueuedToast(false);
    }, 6000);
  };

  return (
    <div
      id="upload-survey-image-page"
      className="flex-1 flex flex-col h-full bg-[#E7E2D4]"
    >
      {/* Top Ledger Subheader Bar */}
      <div className="pt-14">
        <UploadHeaderLedger />
      </div>

      {/* Rigorous Scientific Stepper Bar */}
      <ScientificStepperBar
        onStepClick={(step) => {
          if (step <= 2) {
            onNavigateToMap();
          }
        }}
      />

      {/* Enqueued Toast Notification */}
      {enqueuedToast && (
        <div
          id="enqueued-success-alert"
          className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-4"
        >
          <div className="p-3 bg-[#505E21] text-white border border-[#39460B] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Survey record enqueued to Curation Queue (#19 Pending).</span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToSubmissions && (
                <button
                  type="button"
                  onClick={onNavigateToSubmissions}
                  className="px-2.5 py-1 bg-[#FAF8F3] text-[#1D1C13] font-mono text-[11px] font-bold uppercase hover:bg-white transition-colors"
                >
                  View My Submissions
                </button>
              )}
              <button
                type="button"
                onClick={onOpenCurationQueue}
                className="px-2.5 py-1 bg-white text-[#39460B] font-mono text-[11px] font-bold uppercase hover:bg-white/90 transition-colors"
              >
                Open Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid (8 Cols Left, 4 Cols Right) */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Main Inspection Viewport & Marginalia Notes (8 Cols) */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            <QuadratViewport
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <FieldNotesLedger />
          </section>

          {/* RIGHT COLUMN: Location Integrity, Provisional Counts & Review Actions (4 Cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4">
            <LocationIntegrityCard
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={onSelectStation}
            />

            <ProvisionalCountsCard
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <ReviewActionsSection
              onBackToLocation={onNavigateToMap}
              onStartOver={() => {
                setSelectedCategory(null);
                setEnqueuedToast(false);
              }}
              onEnqueued={handleEnqueued}
            />
          </section>
        </div>
      </main>
    </div>
  );
};
