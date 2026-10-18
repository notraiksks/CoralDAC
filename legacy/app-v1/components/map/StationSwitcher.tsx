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
    <div className="reef-r-full bg-[color:var(--color-reef-deep)]/85 backdrop-blur-md border border-[color:var(--color-reef-line)] pointer-events-auto select-none">
      <select
        value={selectedStationId}
        onChange={(e) => onSelectStation(e.target.value)}
        className="reef-r-full bg-transparent text-[13px] text-[color:var(--color-reef-sand)] px-4 py-2.5 cursor-pointer outline-none appearance-none min-w-[180px]"
      >
        {stations.map((station) => (
          <option
            key={station.id}
            value={station.id}
            className="bg-[color:var(--color-reef-deep)]"
          >
            {station.name}
          </option>
        ))}
      </select>
    </div>
  );
};
