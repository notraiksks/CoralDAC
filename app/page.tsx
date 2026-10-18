'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { HamburgerButton, NavPanel, PAGE_TITLES, TabId, TopBar } from './components/AppShell';
import { MapScreen } from './components/MapScreen';
import { UploadScreen } from './components/UploadScreen';
import { MyUploadsScreen } from './components/MyUploadsScreen';
import { ImageDetailsScreen } from './components/ImageDetailsScreen';
import { STATIONS } from './data/reefStations';
import { buildSeedImages } from './data/seedImages';
import { ReefImage } from './lib/types';
import { clearUploads, loadOverrides, loadUploads, saveOverride, saveUploads, updateUpload } from './lib/store';

interface Toast {
  msg: string;
  action?: { label: string; run: () => void };
}

export default function Page() {
  const [tab, setTab] = useState<TabId>('map');
  const [images, setImages] = useState<ReefImage[]>(() => buildSeedImages());
  const [detail, setDetail] = useState<{ id: string; ids: string[] } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ lat: number; lng: number; stationId: string | null; imageId: string; nonce: number } | null>(null);

  // restore uploads + review edits saved in this browser
  useEffect(() => {
    let alive = true;
    (async () => {
      const [ups, overrides] = await Promise.all([loadUploads(), Promise.resolve(loadOverrides())]);
      if (!alive) return;
      setImages((all) => {
        const known = new Set(all.map((i) => i.id));
        const merged = all.map((i) => (overrides[i.id] ? { ...i, ...overrides[i.id] } : i));
        return [...merged, ...ups.filter((u) => !known.has(u.id))];
      });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [tab, detail?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const uploads = useMemo(() => images.filter((i) => i.source === 'upload'), [images]);
  const pendingUploads = uploads.filter((i) => i.status === 'pending').length;

  const detailImage = detail ? images.find((i) => i.id === detail.id) ?? null : null;
  const detailIndex = detail ? detail.ids.indexOf(detail.id) : -1;

  const changeTab = (t: TabId) => {
    setDetail(null);
    setTab(t);
  };

  const viewOnMap = useCallback((img: ReefImage) => {
    setDetail(null);
    setTab('map');
    setFocusRequest({ lat: img.lat, lng: img.lng, stationId: img.stationId, imageId: img.id, nonce: Date.now() });
  }, []);

  const updateImage = (img: ReefImage) => {
    setImages((all) => all.map((i) => (i.id === img.id ? img : i)));
    if (img.source === 'upload') void updateUpload(img);
    else saveOverride(img);
  };

  const clearMine = () => {
    uploads.forEach((u) => u.src.startsWith('blob:') && URL.revokeObjectURL(u.src));
    setImages((all) => all.filter((i) => i.source !== 'upload'));
    void clearUploads();
    setDetail(null);
    setToast({ msg: 'Your uploads were removed from this browser.' });
  };

  const saved = (imgs: ReefImage[], files: File[]) => {
    setImages((all) => [...all, ...imgs]);
    void saveUploads(imgs, files);
    if (imgs.length === 1) {
      setTab('mine');
      setDetail({ id: imgs[0].id, ids: [imgs[0].id] });
      setToast({ msg: 'Image added. It is pending review and already shows on the map.', action: { label: 'View on map', run: () => viewOnMap(imgs[0]) } });
    } else {
      setTab('mine');
      setToast({ msg: `${imgs.length} images added. They are pending review and already show on the map.`, action: { label: 'View on map', run: () => viewOnMap(imgs[0]) } });
    }
  };

  const mapVisible = tab === 'map' && !detail;
  const pageTitle = detail ? 'Image details' : PAGE_TITLES[tab];

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <HamburgerButton open={navOpen} onToggle={() => setNavOpen((v) => !v)} />
      <NavPanel open={navOpen} onClose={() => setNavOpen(false)} active={tab} onChange={changeTab} pendingBadge={pendingUploads} />

      {/* the map owns the whole viewport; it stays mounted so its position and filters survive */}
      <div className={mapVisible ? 'absolute inset-0' : 'hidden'}>
        <MapScreen
          images={images}
          stations={STATIONS}
          active={mapVisible}
          focusRequest={focusRequest}
          onUpdateImage={updateImage}
          onOpenImage={(id, ids) => setDetail({ id, ids })}
        />
      </div>

      {/* every other page scrolls under a slim top bar */}
      <div className={mapVisible ? 'hidden' : 'absolute inset-0 flex flex-col'}>
        <TopBar title={pageTitle} />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className={tab === 'upload' && !detail ? '' : 'hidden'}>
            <UploadScreen stations={STATIONS} existing={images} onSaved={saved} />
          </div>

          {tab === 'mine' && !detail && (
            <MyUploadsScreen uploads={uploads} onOpen={(id, ids) => setDetail({ id, ids })} onGoUpload={() => changeTab('upload')} onClear={clearMine} />
          )}

          {detail && detailImage && (
            <ImageDetailsScreen
              key={detailImage.id}
              image={detailImage}
              position={{ index: Math.max(0, detailIndex), total: detail.ids.length }}
              onBack={() => setDetail(null)}
              onPrev={detailIndex > 0 ? () => setDetail({ ...detail, id: detail.ids[detailIndex - 1] }) : null}
              onNext={detailIndex >= 0 && detailIndex < detail.ids.length - 1 ? () => setDetail({ ...detail, id: detail.ids[detailIndex + 1] }) : null}
              onUpdate={updateImage}
              onViewOnMap={viewOnMap}
            />
          )}
        </main>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[2000] flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full bg-[#1f2430] py-2.5 pl-5 pr-3 text-[13px] text-white shadow-xl">
          <span>{toast.msg}</span>
          {toast.action && (
            <button type="button" onClick={() => { toast.action!.run(); setToast(null); }} className="cursor-pointer rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#1f2430] hover:bg-[#e7ecff]">
              {toast.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)} className="cursor-pointer rounded-full p-1 text-white/70 hover:text-white"><X size={15} /></button>
        </div>
      )}
    </div>
  );
}
