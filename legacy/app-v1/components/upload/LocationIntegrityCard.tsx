import React, { useState } from 'react';
import { MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';
import { StationData } from '../../types';

interface LocationIntegrityCardProps {
  stations: StationData[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
}

export const LocationIntegrityCard: React.FC<LocationIntegrityCardProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
}) => {
  const [isChangingLocation, setIsChangingLocation] = useState(false);

  const currentStation =
    stations.find((station) => station.id === selectedStationId) ?? stations[0];

  const handleStationPick = (station: StationData) => {
    onSelectStation?.(station.id);
    setIsChangingLocation(false);
  };

  return (
    <div className="reef-r-xl bg-[color:var(--color-reef-deep)]/60 border border-[color:var(--color-reef-line)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[color:var(--color-reef-line)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin size={15} className="text-[color:var(--color-reef-shallow-2)]" />
          <span className="text-[13px] font-medium text-[color:var(--color-reef-sand)]">
            Station reference
          </span>
        </div>
        <span className="reef-r-full px-2 py-0.5 text-[10px] bg-[color:var(--color-reef-shallow-2)]/20 text-[color:var(--color-reef-shallow-2)] font-medium">
          Assigned
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="reef-r-lg bg-white/5 px-3 py-2.5">
          <div className="text-[13px] font-medium text-[color:var(--color-reef-sand)]">
            {currentStation?.name ?? 'No station selected'}
          </div>
          <div className="text-[11.5px] text-[color:var(--color-reef-sand-dim)] mt-0.5">
            {currentStation?.coordinates ?? 'Unavailable'} · {currentStation?.depth}m depth
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsChangingLocation(!isChangingLocation)}
            className="text-[12px] text-[color:var(--color-reef-shallow-2)] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
          >
            {isChangingLocation ? 'Cancel' : 'Change reference station'}
            <ChevronRight size={13} />
          </button>
        </div>

        {isChangingLocation && (
          <div className="reef-r-lg p-2 bg-white/5 border border-[color:var(--color-reef-line)] flex flex-col gap-1 max-h-52 overflow-y-auto">
            {stations.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStationPick(st)}
                className="reef-r-md text-left px-2.5 py-2 hover:bg-white/5 flex justify-between items-center transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-[12.5px] font-medium text-[color:var(--color-reef-sand)]">
                    {st.name}
                  </div>
                  <div className="text-[11px] text-[color:var(--color-reef-sand-dim)]">
                    {st.coordinates} · {st.depth}m
                  </div>
                </div>
                {st.id === currentStation?.id && (
                  <CheckCircle2 size={14} className="text-[color:var(--color-reef-shallow-2)]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
