'use client';

import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Crosshair, Download, Maximize2, RotateCcw } from 'lucide-react';
import { CLASS_META, CLASS_ORDER, CoralClass, ReefImage } from '../lib/types';
import { coverOf } from '../lib/reefMath';
import { getImageSrc } from '../lib/imageArt';
import { formatCaptured, formatLat, formatLng } from '../lib/geo';
import { exportPatchesCsv } from '../lib/exportCsv';
import { CoverBar, GhostButton, PrimaryButton, StatusBadge } from './ui';
import { PhotoViewer, PhotoViewerHandle } from './PhotoViewer';

interface Props {
  image: ReefImage;
  position: { index: number; total: number };
  backLabel: string;
  onBack: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onUpdate: (img: ReefImage) => void;
  onCenter: () => void;
  onOpenFull: () => void;
}

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex gap-1.5">
    <dt className="shrink-0 font-bold">{k}:</dt>
    <dd className="min-w-0 break-words text-[#2d3340]">{v}</dd>
  </div>
);

const circleBtn =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#eef1fb] text-[#2d3340] transition hover:bg-[#e0e6f8] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-[#eef1fb]';

export const PhotoDetailPanel: React.FC<Props> = ({ image, position, backLabel, onBack, onPrev, onNext, onUpdate, onCenter, onOpenFull }) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const viewer = useRef<PhotoViewerHandle>(null);
  const cover = useMemo(() => coverOf(image.patches), [image.patches]);
  const src = getImageSrc(image);

  const focusPatch = (id: string) => {
    viewer.current?.focusPatch(id);
    setHover(id);
  };

  const setClass = (patchId: string, cls: CoralClass) =>
    onUpdate({ ...image, patches: image.patches.map((p) => (p.id === patchId ? { ...p, cls } : p)) });

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(`${image.lat.toFixed(6)}, ${image.lng.toFixed(6)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="text-[13px] text-[#1f2430]">
      {/* navigation row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="flex cursor-pointer items-center gap-1 rounded-full bg-[#eef1fb] py-1.5 pl-2 pr-3.5 text-[12.5px] font-semibold text-[#2d3340] transition hover:bg-[#e0e6f8]">
          <ChevronLeft size={16} /> {backLabel}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[12px] text-[#6b7280]">{position.index + 1} of {position.total}</span>
          <button type="button" aria-label="Previous photo" disabled={!onPrev} onClick={() => onPrev?.()} className={circleBtn}><ChevronLeft size={17} /></button>
          <button type="button" aria-label="Next photo" disabled={!onNext} onClick={() => onNext?.()} className={circleBtn}><ChevronRight size={17} /></button>
          <button type="button" aria-label="Open full view" title="Open full view" onClick={onOpenFull} className={circleBtn}><Maximize2 size={15} /></button>
        </div>
      </div>

      <PhotoViewer ref={viewer} image={image} showBoxes={showBoxes} hover={hover} onHover={setHover} compact className="rounded-[26px] border-4 border-white shadow-[0_14px_30px_-14px_rgba(52,62,140,.6)]" />
      <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-[12.5px] text-[#2d3340]">
        <input type="checkbox" checked={showBoxes} onChange={(e) => setShowBoxes(e.target.checked)} className="round-check" />
        Show detection boxes
      </label>

      {/* details */}
      <section className="mt-4">
        <h3 className="font-display mb-2 text-[15px] font-semibold">Details</h3>
        <dl className="space-y-1.5">
          <Row k="Station" v={image.location} />
          <Row k="Transect Number" v={image.transect} />
          <Row k="Quadrat Number" v={String(image.quadrat)} />
          <Row k="Captured" v={formatCaptured(image.capturedAt)} />
          <Row k="Camera" v={image.camera || '—'} />
          <Row k="File" v={image.name} />
        </dl>
      </section>

      <section className="mt-4 border-t border-[#e4e7f3] pt-4">
        <h3 className="font-display mb-2 text-[15px] font-semibold">Location</h3>
        <dl className="space-y-1.5">
          <Row k="Latitude" v={formatLat(image.lat)} />
          <Row k="Longitude" v={formatLng(image.lng)} />
          <Row k="Decimal" v={`${image.lat.toFixed(5)}, ${image.lng.toFixed(5)}`} />
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <GhostButton icon={<Crosshair size={14} />} onClick={onCenter}>Center on map</GhostButton>
          <GhostButton icon={<Copy size={14} />} onClick={copyCoords}>{copied ? 'Copied' : 'Copy'}</GhostButton>
          <GhostButton icon={<Download size={14} />} onClick={() => exportPatchesCsv(image)}>Patches CSV</GhostButton>
        </div>
      </section>

      <section className="mt-4 border-t border-[#e4e7f3] pt-4">
        <h3 className="font-display mb-2 flex items-center justify-between text-[15px] font-semibold">
          Review <StatusBadge status={image.status} />
        </h3>
        <div className="mb-1 text-[11.5px] text-[#4b5160]">Cover in this image</div>
        <CoverBar cover={cover} />
        <div className="mt-1 text-[11.5px] text-[#4b5160]">{CLASS_ORDER.map((k) => `${CLASS_META[k].short} ${cover[k].toFixed(0)}%`).join(' · ')}</div>
        <div className="mt-3">
          {image.status === 'pending' ? (
            <PrimaryButton icon={<CheckCircle2 size={15} />} onClick={() => onUpdate({ ...image, status: 'verified' })}>Mark as verified</PrimaryButton>
          ) : (
            <GhostButton icon={<RotateCcw size={14} />} onClick={() => onUpdate({ ...image, status: 'pending' })}>Re-open for review</GhostButton>
          )}
        </div>
      </section>

      {/* patches */}
      <section className="mt-4 border-t border-[#e4e7f3] pt-4">
        <h3 className="font-display mb-2 text-[15px] font-semibold">Patches <span className="text-[12px] font-medium text-[#6b7280]">· {image.patches.length} detected</span></h3>
        <div className="overflow-x-auto rounded-3xl ring-1 ring-[#e4e7f3]">
          <table className="w-full min-w-[380px] text-left text-[12px]">
            <thead className="bg-[#eef1fb] text-[10.5px] uppercase tracking-wide text-[#4b5160]">
              <tr>
                <th className="px-3 py-2">Patch</th>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Conf.</th>
                <th className="px-3 py-2 text-right">Area</th>
              </tr>
            </thead>
            <tbody>
              {image.patches.map((p) => (
                <tr key={p.id} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} onClick={() => focusPatch(p.id)} className={`cursor-pointer border-t border-[#eceef3] ${hover === p.id ? 'bg-[#eef2ff]' : ''}`}>
                  <td className="px-3 py-1.5 font-semibold">{p.id}</td>
                  <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full" style={{ background: CLASS_META[p.cls].color }} />
                      <select value={p.cls} onChange={(e) => setClass(p.id, e.target.value as CoralClass)} aria-label={`Class for ${p.id}`} className="cursor-pointer rounded-full border border-transparent bg-transparent py-0.5 font-semibold hover:border-[#d9def0]">
                        {CLASS_ORDER.map((k) => (
                          <option key={k} value={k}>{CLASS_META[k].short} — {CLASS_META[k].label}</option>
                        ))}
                      </select>
                    </span>
                  </td>
                  <td className="px-3 py-1.5 tabular-nums">{p.confidence.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{p.areaPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#e3e8f8] to-[#d6e8ee] p-4">
          <div className="font-display mb-3 flex items-center justify-between text-[14px] font-semibold">
            <span>No. of Corals in the Image</span>
            <span className="rounded-full bg-white px-3 py-0.5 text-[12.5px]">{image.patches.length}</span>
          </div>
          <ul className="reef-scroll flex gap-3 overflow-x-auto pb-1">
            {image.patches.map((p) => {
              const [bx, by, bw, bh] = p.box;
              return (
                <li key={p.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => focusPatch(p.id)}
                    onMouseEnter={() => setHover(p.id)}
                    onMouseLeave={() => setHover(null)}
                    aria-label={`Patch ${p.id}, ${CLASS_META[p.cls].label}`}
                    className="relative block h-20 w-20 cursor-pointer overflow-hidden rounded-full shadow-[0_10px_20px_-8px_rgba(0,0,0,.5)] ring-4 transition hover:scale-105 focus:outline-none focus-visible:ring-[6px]"
                    style={{
                      ['--tw-ring-color' as string]: CLASS_META[p.cls].color,
                      backgroundImage: `url("${src}")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: `${(image.width / bw) * 100}% ${(image.height / bh) * 100}%`,
                      backgroundPosition: `${image.width === bw ? 0 : (bx / (image.width - bw)) * 100}% ${image.height === bh ? 0 : (by / (image.height - bh)) * 100}%`,
                    }}
                  >
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9.5px] font-bold text-white">{p.id} · {CLASS_META[p.cls].short}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
};
