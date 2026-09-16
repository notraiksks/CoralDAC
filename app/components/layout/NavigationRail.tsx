import React from 'react';
import {
  Globe,
  Upload,
  FolderOpen,
  ClipboardCheck,
  Radio,
  Activity,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';

interface NavigationRailProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenTriage: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onSelectTab,
  onOpenTriage,
}) => {
  return (
    <aside
      id="app-navigation-rail"
      className="fixed left-0 top-0 h-full w-16 bg-[#16232E] z-50 flex flex-col justify-between items-center py-3.5 border-r border-[#3B4854]"
    >
      <div className="flex flex-col items-center w-full">
        {/* Archival Research Emblem */}
        <div
          id="system-emblem"
          className="w-10 h-10 mb-5 flex items-center justify-center border border-[#70787C] bg-[#1E5F74] text-[#FAF8F3] font-serif text-lg font-bold select-none cursor-pointer hover:brightness-110 transition-all"
          title="Great Barrier Reef Survey Archive"
        >
          Ψ
        </div>

        {/* Primary Navigation Cluster */}
        <nav className="flex flex-col items-center w-full gap-1">
          <button
            id="nav-btn-map"
            onClick={() => onSelectTab('map')}
            className={`relative flex items-center justify-center w-full h-12 transition-colors ${
              activeTab === 'map'
                ? 'bg-[#1E5F74] text-[#FAF8F3] border-l-2 border-[#9CD7EF]'
                : 'text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3]'
            }`}
            title="Reef Health Map (Active)"
            type="button"
          >
            <Globe size={20} />
          </button>

          <button
            id="nav-btn-ingestion"
            onClick={() => onSelectTab('upload')}
            className={`relative flex items-center justify-center w-full h-12 transition-colors ${
              activeTab === 'upload'
                ? 'bg-[#1E5F74] text-[#FAF8F3] border-l-2 border-[#9CD7EF]'
                : 'text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3]'
            }`}
            title="Upload Survey Image"
            type="button"
          >
            <Upload size={20} />
            <span className="sr-only">Upload Survey Image</span>
          </button>

          <button
            id="nav-btn-submissions"
            onClick={() => onSelectTab('submissions')}
            className={`relative flex items-center justify-center w-full h-12 transition-colors ${
              activeTab === 'submissions'
                ? 'bg-[#1E5F74] text-[#FAF8F3] border-l-2 border-[#9CD7EF]'
                : 'text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3]'
            }`}
            title="My Submissions (14 Records)"
            type="button"
          >
            <FolderOpen size={20} />
            <span className="sr-only">My Submissions</span>
          </button>

          <button
            id="nav-btn-triage"
            onClick={onOpenTriage}
            className="relative flex items-center justify-center w-full h-12 text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3] transition-colors"
            title="Benthic Curation Queue (19 Pending)"
            type="button"
          >
            <ClipboardCheck size={20} />
            <span
              id="triage-badge-counter"
              className="absolute top-2 right-2 flex items-center justify-center px-1 min-w-[14px] h-[14px] bg-[#BA1A1A] text-white font-mono text-[10px] font-bold"
            >
              19
            </span>
          </button>

          <button
            id="nav-btn-stations"
            onClick={() => onSelectTab('stations')}
            className="relative flex items-center justify-center w-full h-12 text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3] transition-colors"
            title="Survey Monitoring Stations"
            type="button"
          >
            <Radio size={20} />
          </button>

          <button
            id="nav-btn-diagnostics"
            onClick={() => onSelectTab('diagnostics')}
            className="relative flex items-center justify-center w-full h-12 text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3] transition-colors"
            title="Benthic Health Diagnostics (ResNet50)"
            type="button"
          >
            <Activity size={20} />
          </button>
        </nav>
      </div>

      {/* Auxiliary Footer Tools */}
      <div className="flex flex-col items-center w-full">
        <div className="w-8 h-[1px] bg-[#53606D] mb-2" />
        <nav className="flex flex-col items-center w-full gap-1">
          <button
            id="nav-btn-settings"
            onClick={() => onSelectTab('settings')}
            className="flex items-center justify-center w-full h-11 text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3] transition-colors"
            title="Settings & Display Preferences"
            type="button"
          >
            <SlidersHorizontal size={19} />
          </button>
          <button
            id="nav-btn-logout"
            onClick={() => onSelectTab('logout')}
            className="flex items-center justify-center w-full h-11 text-[#BAC8D7] hover:bg-[#FAF8F3]/10 hover:text-[#FAF8F3] transition-colors"
            title="Station Sign Out"
            type="button"
          >
            <LogOut size={19} />
          </button>
        </nav>
      </div>
    </aside>
  );
};
