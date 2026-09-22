import React, { useState } from 'react';
import { StationData } from '../types';
import {
  UploadHeaderLedger,
  ScientificStepperBar,
  QuadratViewport,
  LocationIntegrityCard,
  ProvisionalCountsCard,
  ReviewActionsSection,
} from '../components/upload';

interface UploadSurveyImagePageProps {
  stations: StationData[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onNavigateToMap: () => void;
}

export const UploadSurveyImagePage: React.FC<UploadSurveyImagePageProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onNavigateToMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'LC' | 'PB' | 'DC' | 'DCA' | null>(null);

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

      {/* Main Content Grid (8 Cols Left, 4 Cols Right) */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Main Inspection Viewport (8 Cols) */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            <QuadratViewport
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
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
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
};
