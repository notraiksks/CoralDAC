import React, { useState } from 'react';
import { Search, User, Check, Navigation } from 'lucide-react';
import { StationData } from '../../types';

interface GlobalHeaderProps {
  stations: StationData[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredStations = stations.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.coordinates.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      id="global-system-header"
      className="fixed top-0 left-16 right-0 h-14 bg-[#FAF8F3] border-b border-[#C0C8CC] z-40 px-8 flex items-center justify-between"
    >
      {/* Left System Identification */}
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-xs uppercase text-[#53606D] tracking-widest font-semibold">
          REEF HEALTH ARCHIVE // CAIRNS SECTOR
        </span>
      </div>

      {/* Center/Right Search & Station Navigator */}
      <div className="flex items-center gap-5">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 text-[#70787C]" size={15} />
          <input
            id="station-coordinate-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 250)}
            className="w-80 md:w-96 h-8 pl-8 pr-3 bg-[#FEF9EB] font-mono text-[11px] text-[#1D1C13] placeholder:text-[#70787C] border border-[#C0C8CC] focus:outline-none focus:border-[#1E5F74] focus:ring-1 focus:ring-[#1E5F74] transition-all"
            placeholder="Search station or coordinates (e.g. 16°49'S, Baker-04)"
            type="text"
          />

          {/* Quick Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div
              id="search-autocomplete-dropdown"
              className="absolute left-0 top-9 w-full bg-[#FAF8F3] border border-[#16232E] shadow-[3px_3px_0px_#16232E] z-50 p-1 divide-y divide-[#E7E2D4]"
            >
              {filteredStations.length === 0 ? (
                <div className="p-2 font-mono text-[11px] text-[#70787C]">
                  No matching station or coordinates found.
                </div>
              ) : (
                filteredStations.map((station) => (
                  <button
                    key={station.id}
                    onMouseDown={() => {
                      onSelectStation(station.id);
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    type="button"
                    className={`w-full text-left p-2 flex items-center justify-between hover:bg-[#F3EEDF] transition-colors font-mono text-[11px] ${
                      selectedStationId === station.id ? 'bg-[#EDE8DA]' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-[#16232E] flex items-center gap-1.5">
                        <Navigation size={12} className="text-[#1E5F74]" />
                        <span>{station.id}</span>
                        <span className="font-sans font-normal text-[#53606D]">
                          — {station.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#70787C]">
                        {station.coordinates} · {station.depth}m
                      </div>
                    </div>
                    {selectedStationId === station.id && (
                      <Check size={14} className="text-[#00475A]" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Structural Hairline Divider */}
        <div className="h-6 w-[1px] bg-[#C0C8CC]" />

        {/* Review Audit Session Status */}
        <div
          id="operator-profile-badge"
          className="flex items-center gap-2.5"
          title="Review Console: Benthic Health Audit"
        >
          <div className="flex flex-col text-right">
            <span className="font-mono text-xs text-[#1D1C13] font-semibold">
              Review Console
            </span>
            <span className="font-mono text-[10px] text-[#53606D]">
              Benthic Health Audit Active
            </span>
          </div>
          <div
            id="operator-avatar"
            className="w-8 h-8 bg-[#00475A] border border-[#16232E] flex items-center justify-center text-white"
          >
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  );
};
