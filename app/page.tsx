'use client';

import React, { useState } from 'react';
import { STATIONS, INITIAL_SUBMISSIONS } from './data';
import { NavigationRail, GlobalHeader } from './components/layout';
import {
  ReefHealthMapPage,
  UploadSurveyImagePage,
  MySubmissionsPage,
} from './views';
import { TriageQueueModal } from './components/modals/TriageQueueModal';
import { StationDetailModal } from './components/modals/StationDetailModal';
import { PastTransectsModal } from './components/modals/PastTransectsModal';
import { SubmissionRecord } from './types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'map' | 'upload' | 'submissions'>('submissions');
  const [selectedStationId, setSelectedStationId] = useState<string>(STATIONS[0].id);
  const [submissionsList] = useState<SubmissionRecord[]>(INITIAL_SUBMISSIONS);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isStationDetailOpen, setIsStationDetailOpen] = useState(false);
  const [isPastTransectsOpen, setIsPastTransectsOpen] = useState(false);

  const currentStation =
    STATIONS.find((station) => station.id === selectedStationId) || STATIONS[0];

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#E7E2D4] text-[#1D1C13]">
      <NavigationRail
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'map' || tab === 'upload' || tab === 'submissions') {
            setActiveTab(tab);
          } else if (tab === 'stations') {
            setIsStationDetailOpen(true);
          } else if (tab === 'transects') {
            setIsPastTransectsOpen(true);
          } else if (tab === 'diagnostics') {
            setIsTriageOpen(true);
          }
        }}
        onOpenTriage={() => setIsTriageOpen(true)}
      />

      <div className="flex-1 pl-16 flex flex-col h-full overflow-hidden">
        <GlobalHeader
          stations={STATIONS}
          selectedStationId={selectedStationId}
          onSelectStation={(id) => {
            setSelectedStationId(id);
            setActiveTab('map');
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'upload' && (
            <UploadSurveyImagePage
              stations={STATIONS}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              onNavigateToMap={() => setActiveTab('map')}
              onNavigateToSubmissions={() => setActiveTab('submissions')}
              onOpenCurationQueue={() => setIsTriageOpen(true)}
            />
          )}

          {activeTab === 'submissions' && (
            <MySubmissionsPage
              submissions={submissionsList}
              onNavigateToUpload={() => setActiveTab('upload')}
              onNavigateToMap={(stationId) => {
                if (stationId && STATIONS.some((station) => station.id === stationId)) {
                  setSelectedStationId(stationId);
                }
                setActiveTab('map');
              }}
              onOpenCurationQueue={() => setIsTriageOpen(true)}
            />
          )}

          {activeTab === 'map' && (
            <ReefHealthMapPage
              stations={STATIONS}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              setIsTriageOpen={setIsTriageOpen}
              setIsStationDetailOpen={setIsStationDetailOpen}
              setIsPastTransectsOpen={setIsPastTransectsOpen}
            />
          )}
        </div>
      </div>

      <TriageQueueModal
        key={currentStation.id}
        station={currentStation}
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
      />
      <StationDetailModal
        station={currentStation}
        isOpen={isStationDetailOpen}
        onClose={() => setIsStationDetailOpen(false)}
        onOpenTriage={() => setIsTriageOpen(true)}
      />
      <PastTransectsModal
        station={currentStation}
        isOpen={isPastTransectsOpen}
        onClose={() => setIsPastTransectsOpen(false)}
      />
    </div>
  );
}