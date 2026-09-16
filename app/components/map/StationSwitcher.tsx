import React from 'react';
import { StationData } from '../../types';

interface StationSwitcherProps {
  stations: StationData[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
}

export const StationSwitcher: React.FC<StationSwitcherProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
}) => {
  return (
    <div
      id="quick-station-switcher"
      className="bg-[#FAF8F3] border border-[#16232E] shadow-[2px_2px_0px_#16232E] p-1 flex items-center gap-1 z-30 pointer-events-auto select-none"
    >
      <span className="px-2 font-mono text-[10px] text-[#53606D] uppercase font-semibold tracking-wider">
        Stations:
      </span>
      {stations.map((station) => {
        const isSelected = selectedStationId === station.id;
        return (
          <button
            key={station.id}
            id={`btn-select-${station.id.toLowerCase()}`}
            onClick={() => onSelectStation(station.id)}
            type="button"
            className={`px-2.5 py-1 font-mono text-[11px] transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#00475A] text-[#FAF8F3] font-semibold shadow-[1px_1px_0px_#16232E]'
                : 'bg-[#FEF9EB] hover:bg-[#F3EEDF] border border-[#C0C8CC] text-[#1D1C13]'
            }`}
          >
            {station.id}
          </button>
        );
      })}
    </div>
  );
};
