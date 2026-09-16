import React, { useState } from 'react';
import { MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ASSET_REFERENCES } from '../../assets';
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
  const currentStationName = currentStation
    ? `${currentStation.name} (${currentStation.id})`
    : 'No station selected';
  const currentCoords = currentStation?.coordinates ?? 'Unavailable';
  const geoHash = currentStation ? `9RW${currentStation.id.slice(-2)}` : 'N/A';

  const handleStationPick = (station: StationData) => {
    onSelectStation?.(station.id);
    setIsChangingLocation(false);
  };

  return (
    <div id="location-integrity-card" className="bg-[#FEF9EB] border border-[#D1CBBF] flex flex-col">
      <div className="bg-[#F9F3E5] px-4 py-2 border-b border-[#D1CBBF] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin size={16} className="text-[#00475A]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1D1C13]">
            Station Reference
          </span>
        </div>
        <span className="px-1.5 py-0.5 font-mono text-[10px] bg-[#00475A] text-[#FFFFFF] uppercase tracking-wider font-semibold">
          ASSIGNED
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Segmented Control State */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#1D1C13]">
          <span className="w-2 h-2 bg-[#00475A] rounded-full inline-block" />
          <span className="font-bold">Associated Survey Station:</span>
        </div>

        {/* Coordinate Block */}
        <div className="bg-[#F3EEDF] px-3 py-2 border border-[#D1CBBF] font-mono text-xs">
          <div className="text-[#1D1C13] font-semibold">{currentCoords}</div>
          <div className="text-[#53606D] text-[10px] mt-0.5">{currentStationName}</div>
        </div>

        {/* Mini Static Map Preview */}
        <div
          id="mini-map-preview"
          className="w-full h-28 bg-[#E7E2D4] border border-[#D1CBBF] relative flex flex-col items-center justify-center overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: `url('${ASSET_REFERENCES.stationMiniMapPreview}')`,
          }}
        >
          <div className="absolute inset-0 bg-[#00475A]/25 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center bg-[#FEF9EB]/95 px-3 py-1.5 border border-[#00475A] text-center shadow-sm">
            <span className="font-mono text-[11px] font-bold text-[#00475A]">
              {currentStationName.split(' ')[0]} {currentStationName.split(' ')[1] || 'STATION'}
            </span>
            <span className="text-[9px] font-mono text-[#53606D]">
              GEO-HASH: {geoHash}
            </span>
          </div>
        </div>

        {/* Change Action */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            id="change-location-btn"
            onClick={() => setIsChangingLocation(!isChangingLocation)}
            className="font-mono text-xs text-[#00475A] hover:underline font-semibold flex items-center gap-0.5"
          >
            {isChangingLocation ? 'Cancel' : 'Change reference station'}
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Interactive Station Picker Drawer/Dropdown */}
        {isChangingLocation && (
          <div className="mt-2 p-2 bg-[#FAF8F3] border border-[#00475A] flex flex-col gap-1.5 max-h-48 overflow-y-auto font-mono text-xs">
            <div className="text-[10px] uppercase font-bold text-[#53606D] pb-1 border-b border-[#D1CBBF]">
              Select Associated Survey Station:
            </div>
            {stations.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStationPick(st)}
                className="text-left px-2 py-1.5 hover:bg-[#1E5F74]/15 border border-transparent hover:border-[#1E5F74] flex justify-between items-center transition-colors"
              >
                <div>
                  <div className="font-bold text-[#1D1C13]">{st.name} ({st.id})</div>
                  <div className="text-[10px] text-[#53606D]">{st.coordinates} · {st.depth}m</div>
                </div>
                <CheckCircle2 size={14} className="text-[#00475A]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
