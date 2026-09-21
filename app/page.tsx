'use client';

import React, { useState } from 'react';
import { STATIONS, INITIAL_SUBMISSIONS } from './data';
import { NavigationRail, GlobalHeader } from './components/layout';
import {
  ReefHealthMapPage,
  UploadSurveyImagePage,
  MySubmissionsPage,
  CurationQueuePage,
  StationAnalyticsPage,
  PhotoQuadratInspectionPage,
} from './views';
import { TriageQueueModal } from './components/modals/TriageQueueModal';
import { StationDetailModal } from './components/modals/StationDetailModal';
import { PastTransectsModal } from './components/modals/PastTransectsModal';
import { SubmissionRecord } from './types';

const STATION_BY_ID = new Map(STATIONS.map((station) => [station.id, station]));

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'map' | 'upload' | 'submissions' | 'curation' | 'analytics' | 'specimen'>('map');
  const [selectedStationId, setSelectedStationId] = useState<string>(STATIONS[0].id);
  const [submissionsList] = useState<SubmissionRecord[]>(INITIAL_SUBMISSIONS);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isStationDetailOpen, setIsStationDetailOpen] = useState(false);
  const [isPastTransectsOpen, setIsPastTransectsOpen] = useState(false);

  const currentStation = STATION_BY_ID.get(selectedStationId) ?? STATIONS[0];

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#E7E2D4] text-[#1D1C13]">
      <NavigationRail
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'map' || tab === 'upload' || tab === 'submissions' || tab === 'curation' || tab === 'analytics' || tab === 'specimen') {
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

      <div className="flex-1 min-h-0 pl-16 flex flex-col h-full overflow-hidden">
        <GlobalHeader
          stations={STATIONS}
          selectedStationId={selectedStationId}
          onSelectStation={(id) => {
            setSelectedStationId(id);
            setActiveTab('map');
          }}
        />

        <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 'map' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            
          {activeTab === 'specimen' && (
            <div className="flex-1">
              <PhotoQuadratInspectionPage
                onBackToStation={() => setActiveTab('analytics')}
                onNavigateToMap={() => setActiveTab('map')}
                onNavigateToCuration={() => setActiveTab('curation')}
              />
            </div>
          )}
          
          {activeTab === 'analytics' && (
              <StationAnalyticsPage
                stations={STATIONS}
                selectedStationId={selectedStationId}
                onSelectStation={setSelectedStationId}
                onNavigateToMap={(stationId) => {
                  if (stationId && STATION_BY_ID.has(stationId)) {
                    setSelectedStationId(stationId);
                  }
                  setActiveTab('map');
                }}
                onNavigateToUpload={() => setActiveTab('upload')}
                onNavigateToSubmissions={() => setActiveTab('submissions')}
                onNavigateToCuration={() => setActiveTab('curation')}
              />
          )}

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
                if (stationId && STATION_BY_ID.has(stationId)) {
                  setSelectedStationId(stationId);
                }
                setActiveTab('map');
              }}
              onOpenCurationQueue={() => setIsTriageOpen(true)}
            />
          )}

          {activeTab === 'curation' && (
            <div className="flex-1">
              <CurationQueuePage
                onNavigateToMap={(stationId) => {
                  if (stationId && STATION_BY_ID.has(stationId)) {
                    setSelectedStationId(stationId);
                  }
                  setActiveTab('map');
                }}
                onNavigateToSubmissions={() => setActiveTab('submissions')}
                onNavigateToUpload={() => setActiveTab('upload')}
              />
            </div>
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