'use client';

import React, { useEffect } from 'react';
import { FolderOpen, Map as MapIcon, Menu, UploadCloud, X } from 'lucide-react';
import { CoralLogo } from './ui';

export type TabId = 'map' | 'upload' | 'mine';

const ITEMS: { id: TabId; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: 'map', label: 'Interactive Map', hint: 'Explore reef health across the Philippines', icon: <MapIcon size={20} /> },
  { id: 'upload', label: 'Upload', hint: 'Classify new quadrat photos', icon: <UploadCloud size={20} /> },
  { id: 'mine', label: 'My Uploads', hint: 'Track and verify your photos', icon: <FolderOpen size={20} /> },
];

export const PAGE_TITLES: Record<TabId, string> = { map: 'Interactive Map', upload: 'Upload', mine: 'My Uploads' };

const GRADIENT = 'linear-gradient(160deg,#434872 0%,#6469a3 48%,#4f86d9 100%)';

/** Round hamburger, always pinned top-left; turns into an X while the panel is open. */
export const HamburgerButton: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
    aria-expanded={open}
    aria-controls="nav-panel"
    className="fixed left-4 top-4 z-[1400] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white text-[#2d3a8c] shadow-[0_10px_24px_-8px_rgba(0,0,0,.55)] ring-1 ring-black/5 transition hover:scale-105 hover:bg-[#eef2ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6fe0] active:scale-95"
  >
    <span className="relative block h-6 w-6">
      <Menu size={24} className={`absolute inset-0 transition duration-200 ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
      <X size={24} className={`absolute inset-0 transition duration-200 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
    </span>
  </button>
);

/** Collapsible navigation drawer. Closed = completely out of the way, so the map can use the whole viewport. */
export const NavPanel: React.FC<{
  open: boolean;
  onClose: () => void;
  active: TabId;
  onChange: (t: TabId) => void;
  pendingBadge: number;
}> = ({ open, onClose, active, onChange, pendingBadge }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const connected = !!process.env.NEXT_PUBLIC_API_URL;

  return (
    <>
      {/* scrim */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[1300] bg-[#141a3a]/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        id="nav-panel"
        aria-label="Navigation"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-[1350] flex w-[min(300px,86vw)] flex-col overflow-hidden rounded-r-[32px] text-white shadow-[0_30px_60px_-20px_rgba(20,26,70,.8)] transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: GRADIENT }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/10" />
        <span aria-hidden="true" className="pointer-events-none absolute right-6 top-40 h-16 w-16 rounded-full bg-white/10" />

        {/* brand — sits to the right of the hamburger */}
        <div className="relative flex items-center gap-3 pb-5 pl-[76px] pr-4 pt-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_-4px_rgba(0,0,0,.45)] ring-4 ring-white/25">
            <CoralLogo size={30} />
          </span>
        </div>
        <div className="relative px-6 pb-6">
          <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight">Coral Reef Bleaching Classifier</h2>
          <p className="mt-1 text-[12px] font-medium text-white/75">Reef health across the Philippines</p>
        </div>

        <nav className="relative flex flex-col gap-2 px-4" role="navigation" aria-label="Main">
          {ITEMS.map((it) => {
            const on = it.id === active;
            return (
              <button
                key={it.id}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => {
                  onChange(it.id);
                  onClose();
                }}
                className={`group flex cursor-pointer items-center gap-3.5 rounded-full py-2.5 pl-3 pr-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  on ? 'bg-white text-[#2d3a8c] shadow-[0_10px_22px_-10px_rgba(0,0,0,.55)]' : 'text-white hover:bg-white/15'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${on ? 'bg-gradient-to-br from-[#e6ebff] to-[#d3f1ea] text-[#3f58b0]' : 'bg-white/15'}`}>{it.icon}</span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[14.5px] font-bold">{it.label}</span>
                  <span className={`block truncate text-[11.5px] ${on ? 'text-[#5a64a8]' : 'text-white/70'}`}>{it.hint}</span>
                </span>
                {it.id === 'mine' && pendingBadge > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${on ? 'bg-[#3f58b0] text-white' : 'bg-white text-[#3f58b0]'}`}>{pendingBadge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative mt-auto px-6 pb-6 pt-8 text-[11.5px] leading-relaxed text-white/80">
          <div className="flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 font-semibold">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-[#6ee7a0]' : 'bg-[#f5c026]'}`} />
            {connected ? 'Model API connected' : 'Demo mode · simulated classification'}
          </div>
          <p className="mt-3 px-1 text-white/60">YOLOv8 detection · ResNet50 health classes</p>
        </div>
      </aside>
    </>
  );
};

/** Slim bar for the scrolling pages (the map has no bar so it can be full-bleed). */
export const TopBar: React.FC<{ title: string }> = ({ title }) => (
  <header
    className="relative z-10 flex h-[72px] shrink-0 items-center gap-3 overflow-hidden rounded-b-[28px] pl-[76px] pr-5 text-white shadow-[0_14px_34px_-16px_rgba(52,62,140,.7)]"
    style={{ background: 'linear-gradient(115deg,#434872 0%,#6469a3 42%,#4f86d9 100%)' }}
  >
    <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full bg-white/10" />
    <span aria-hidden="true" className="pointer-events-none absolute right-36 top-8 h-14 w-14 rounded-full bg-white/10" />
    <h1 className="font-display relative truncate text-[18px] font-semibold tracking-tight sm:text-[21px]">Coral Reef Bleaching Classifier</h1>
    <span className="relative ml-auto shrink-0 rounded-full bg-white/18 px-4 py-1.5 text-[13px] font-bold ring-1 ring-white/25">{title}</span>
  </header>
);
