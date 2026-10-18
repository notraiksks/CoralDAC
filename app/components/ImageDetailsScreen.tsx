'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, MapPin, RotateCcw } from 'lucide-react';
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
  onBack: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onUpdate: (img: ReefImage) => void;
  onViewOnMap: (img: ReefImage) => void;
}

export const ImageDetailsScreen: React.FC<Props> = ({ image, position, onBack, onPrev, onNext, onUpdate, onViewOnMap }) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const viewer = useRef<PhotoViewerHandle>(null);

  const src = getImageSrc(image);
  const cover = useMemo(() => coverOf(image.patches), [image.patches]);

  // keyboard shortcuts: ← → switch image · + − zoom · 0 reset · B boxes · Esc back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft') onPrev?.();
      else if (e.key === 'ArrowRight') onNext?.();
      else if (e.key === '+' || e.key === '=') viewer.current?.zoomBy(1.5);
      else if (e.key === '-' || e.key === '_') viewer.current?.zoomBy(1 / 1.5);
      else if (e.key === '0') viewer.current?.reset();
      else if (e.key.toLowerCase() === 'b') setShowBoxes((v) => !v);
      else if (e.key === 'Escape') onBack();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext, onBack]);

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
    <div className="reef-rise mx-auto w-full max-w-[1200px] px-4 pb-10 pt-6">
      {/* top bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <GhostButton icon={<ArrowLeft size={15} />} onClick={onBack}>
          Back to results
        </GhostButton>
        <div className="flex items-center gap-2 text-[13px] text-[#4b5160]">
          <span>
            Image {position.index + 1} of {position.total}
          </span>
          <GhostButton aria-label="Previous image" disabled={!onPrev} onClick={() => onPrev?.()} icon={<ChevronLeft size={15} />}>
            Prev
          </GhostButton>
          <GhostButton aria-label="Next image" disabled={!onNext} onClick={() => onNext?.()}>
            Next <ChevronRight size={15} />
          </GhostButton>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ---------- viewer ---------- */}
        <div>
          <PhotoViewer ref={viewer} image={image} showBoxes={showBoxes} hover={hover} onHover={setHover} className="rounded-[30px] border-[5px] border-white shadow-[0_22px_44px_-18px_rgba(52,62,140,.55)]" />

          <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-[13px] text-[#2d3340]">
            <input type="checkbox" checked={showBoxes} onChange={(e) => setShowBoxes(e.target.checked)} className="round-check" />
            Show detection boxes
          </label>
          <p className="mt-1 hidden text-[11.5px] text-[#8a8f9c] sm:block">
            Shortcuts: <kbd className="rounded-full bg-white px-1.5 ring-1 ring-[#d9def0]">←</kbd> <kbd className="rounded-full bg-white px-1.5 ring-1 ring-[#d9def0]">→</kbd> change image · <kbd className="rounded-full bg-white px-1.5 ring-1 ring-[#d9def0]">+</kbd> <kbd className="rounded-full bg-white px-1.5 ring-1 ring-[#d9def0]">−</kbd> zoom · <kbd className="rounded-full bg-white px-1.5 ring-1 ring-[#d9def0]">B</kbd> boxes · <kbd className="rounded-full bg-white px-1.5 ring-1 ring-[#d9def0]">Esc</kbd> back
          </p>
        </div>

        {/* ---------- details ---------- */}
        <aside className="space-y-5 rounded-[28px] bg-white/85 p-5 text-[13px] text-[#1f2430] shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)] ring-1 ring-white">
          <section>
            <h2 className="font-display mb-2 text-[16px] font-semibold">Details</h2>
            <dl className="space-y-1.5">
              <Row k="Station" v={image.location} />
              <Row k="Transect Number" v={image.transect} />
              <Row k="Quadrat Number" v={String(image.quadrat)} />
              <Row k="Captured" v={formatCaptured(image.capturedAt)} />
              <Row k="Camera" v={image.camera || '—'} />
              <Row k="File" v={image.name} />
            </dl>
          </section>
          <hr className="border-[#c9ccd6]" />
          <section>
            <h2 className="font-display mb-2 text-[16px] font-semibold">Location</h2>
            <dl className="space-y-1.5">
              <Row k="Latitude" v={`${formatLat(image.lat)}`} />
              <Row k="Longitude" v={`${formatLng(image.lng)}`} />
              <Row k="Decimal" v={`${image.lat.toFixed(5)}, ${image.lng.toFixed(5)}`} />
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <GhostButton icon={<MapPin size={14} />} onClick={() => onViewOnMap(image)}>
                View on map
              </GhostButton>
              <GhostButton icon={<Copy size={14} />} onClick={copyCoords}>
                {copied ? 'Copied' : 'Copy'}
              </GhostButton>
              <GhostButton icon={<Download size={14} />} onClick={() => exportPatchesCsv(image)}>
                Patches CSV
              </GhostButton>
            </div>
          </section>
          <hr className="border-[#c9ccd6]" />
          <section>
            <h2 className="font-display mb-2 flex items-center justify-between text-[16px] font-semibold">
              Review <StatusBadge status={image.status} />
            </h2>
            <div className="mb-1 text-[11.5px] text-[#4b5160]">Cover in this image</div>
            <CoverBar cover={cover} />
            <div className="mt-1 text-[11.5px] text-[#4b5160]">
              {CLASS_ORDER.map((k) => `${CLASS_META[k].short} ${cover[k].toFixed(0)}%`).join(' · ')}
            </div>
            <div className="mt-3">
              {image.status === 'pending' ? (
                <PrimaryButton icon={<CheckCircle2 size={15} />} onClick={() => onUpdate({ ...image, status: 'verified' })}>
                  Mark as verified
                </PrimaryButton>
              ) : (
                <GhostButton icon={<RotateCcw size={14} />} onClick={() => onUpdate({ ...image, status: 'pending' })}>
                  Re-open for review
                </GhostButton>
              )}
            </div>
            <p className="mt-2 text-[11.5px] text-[#6b7280]">Change a patch’s class in the table below if the classifier got it wrong, then verify.</p>
          </section>
        </aside>
      </div>

      {/* ---------- patch table ---------- */}
      <div className="mt-6 overflow-x-auto rounded-[28px] bg-white shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)] ring-1 ring-white">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead className="bg-[#eef1fb] text-[11.5px] uppercase tracking-wide text-[#4b5160]">
            <tr>
              <th className="px-3 py-2">Patch ID</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Box (x, y, w, h) px</th>
              <th className="px-3 py-2 text-right">Area (% of image)</th>
            </tr>
          </thead>
          <tbody>
            {image.patches.map((p) => (
              <tr
                key={p.id}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => focusPatch(p.id)}
                className={`cursor-pointer border-t border-[#eceef3] ${hover === p.id ? 'bg-[#eef2ff]' : ''}`}
              >
                <td className="px-3 py-1.5 font-semibold">{p.id}</td>
                <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: CLASS_META[p.cls].color }} />
                    <select
                      value={p.cls}
                      onChange={(e) => setClass(p.id, e.target.value as CoralClass)}
                      aria-label={`Class for ${p.id}`}
                      className="cursor-pointer rounded-lg border border-transparent bg-transparent py-0.5 font-semibold hover:border-[#d5d9e2]"
                    >
                      {CLASS_ORDER.map((k) => (
                        <option key={k} value={k}>
                          {CLASS_META[k].short} — {CLASS_META[k].label}
                        </option>
                      ))}
                    </select>
                  </span>
                </td>
                <td className="px-3 py-1.5 tabular-nums">{p.confidence.toFixed(2)}</td>
                <td className="px-3 py-1.5 tabular-nums">({p.box.join(', ')})</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{p.areaPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- patch thumbnails ---------- */}
      <div className="mt-5 rounded-[32px] bg-gradient-to-br from-[#e3e8f8] to-[#d6e8ee] p-5 shadow-inner">
        <div className="font-display mb-3 flex items-center justify-between text-[15px] font-semibold text-[#1f2430]">
          <span>No. of Corals in the Image</span>
          <span className="rounded-full bg-white px-3 py-0.5 text-[13px]">{image.patches.length}</span>
        </div>
        <ul className="flex gap-3 overflow-x-auto pb-1 reef-scroll">
          {image.patches.map((p) => {
            const [bx, by, bw, bh] = p.box;
            return (
              <li key={p.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => focusPatch(p.id)}
                  onMouseEnter={() => setHover(p.id)}
                  onMouseLeave={() => setHover(null)}
                  className="relative block h-28 w-28 cursor-pointer overflow-hidden rounded-full shadow-[0_10px_20px_-8px_rgba(0,0,0,.5)] ring-4 transition hover:scale-105 focus:outline-none focus-visible:ring-[6px]"
                  style={{
                    ['--tw-ring-color' as string]: CLASS_META[p.cls].color,
                    backgroundImage: `url("${src}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${(image.width / bw) * 100}% ${(image.height / bh) * 100}%`,
                    backgroundPosition: `${image.width === bw ? 0 : (bx / (image.width - bw)) * 100}% ${image.height === bh ? 0 : (by / (image.height - bh)) * 100}%`,
                  }}
                  aria-label={`Patch ${p.id}, ${CLASS_META[p.cls].label}`}
                >
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[10px] font-bold text-white">
                    {p.id} · {CLASS_META[p.cls].short}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex gap-1.5">
    <dt className="shrink-0 font-bold">{k}:</dt>
    <dd className="min-w-0 break-words text-[#2d3340]">{v}</dd>
  </div>
);
