import React, { useState } from 'react';
import { StationData, MapFilters } from '../types';
import { SubHeaderBar } from '../components/layout/SubHeaderBar';
import { ReefMapCanvas } from '../components/map/ReefMapCanvas';
import { FilterModeDrawer } from '../components/modals/FilterModeDrawer';

interface ReefHealthMapPageProps {
  stations: StationData[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  setIsTriageOpen: (open: boolean) => void;
  setIsStationDetailOpen: (open: boolean) => void;
  setIsPastTransectsOpen: (open: boolean) => void;
}

export const ReefHealthMapPage: React.FC<ReefHealthMapPageProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  setIsTriageOpen,
  setIsStationDetailOpen,
  setIsPastTransectsOpen,
}) => {
  // Map Filter State
  const [filters, setFilters] = useState<MapFilters>({
    layers: {
      lc: true,
      pb: true,
      dc: true,
      dca: true,
    },
    heatmapIntensity: 75,
    detectionConfidence: 85,
  });

  const [minDepth, setMinDepth] = useState(0);
  const [maxDepth, setMaxDepth] = useState(50);
  const [isFilterModeOpen, setIsFilterModeOpen] = useState(false);

  // Filter stations based on depth filter if set
  const filteredStations = stations.filter(
    (s) => s.depth >= minDepth && s.depth <= maxDepth
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Sub-Header Context Bar */}
      <div className="pt-14">
        <SubHeaderBar
          onToggleFilterMode={() => setIsFilterModeOpen(true)}
        />
      </div>

      {/* Primary Interactive Map Stage Area */}
      <main className="flex-1 w-full relative overflow-hidden bg-[#E5E9EC]">
        <ReefMapCanvas
          stations={filteredStations}
          selectedStationId={selectedStationId}
          onSelectStation={onSelectStation}
          filters={filters}
          onChangeFilters={setFilters}
          onOpenTriage={() => setIsTriageOpen(true)}
          onOpenStationDetail={() => setIsStationDetailOpen(true)}
          onOpenPastTransects={() => setIsPastTransectsOpen(true)}
        />
      </main>

      {/* Map Specific Filters Drawer */}
      <FilterModeDrawer
        isOpen={isFilterModeOpen}
        onClose={() => setIsFilterModeOpen(false)}
        filters={filters}
        onChangeFilters={setFilters}
        minDepth={minDepth}
        maxDepth={maxDepth}
        onDepthChange={(min, max) => {
          setMinDepth(min);
          setMaxDepth(max);
        }}
      />
    </div>
  );
};
