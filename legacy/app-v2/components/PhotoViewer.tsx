'use client';
/* eslint-disable @next/next/no-img-element */

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { CLASS_META, ReefImage } from '../lib/types';
import { getImageSrc } from '../lib/imageArt';

const MIN_SCALE = 1;
const MAX_SCALE = 10;

export interface PhotoViewerHandle {
  zoomBy: (factor: number) => void;
  reset: () => void;
  focusPatch: (id: string) => void;
}

/** Zoomable / pannable photo with the detection boxes drawn on top. */
export const PhotoViewer = forwardRef<
  PhotoViewerHandle,
  {
    image: ReefImage;
    showBoxes: boolean;
    hover: string | null;
    onHover: (id: string | null) => void;
    compact?: boolean;
    className?: string;
  }
>(({ image, showBoxes, hover, onHover, compact, className = '' }, ref) => {
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);

  const clamp = useCallback((s: number, x: number, y: number) => {
    const el = boxRef.current;
    if (!el) return { s, x, y };
    const w = el.clientWidth;
    const h = el.clientHeight;
    return { s, x: Math.min(0, Math.max(w - w * s, x)), y: Math.min(0, Math.max(h - h * s, y)) };
  }, []);

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const el = boxRef.current;
      if (!el) return;
      setView((v) => {
        const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.s * factor));
        const px = cx ?? el.clientWidth / 2;
        const py = cy ?? el.clientHeight / 2;
        return clamp(s, px - ((px - v.x) / v.s) * s, py - ((py - v.y) / v.s) * s);
      });
    },
    [clamp]
  );

  // wheel zoom needs a non-passive listener so the page/panel doesn't scroll at the same time
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (f) => zoomAt(f),
      reset: () => setView({ s: 1, x: 0, y: 0 }),
      focusPatch: (id) => {
        const p = image.patches.find((x) => x.id === id);
        const el = boxRef.current;
        if (!p || !el) return;
        const [bx, by, bw, bh] = p.box;
        const s = Math.min(MAX_SCALE, Math.max(1, Math.min((image.width / bw) * 0.55, (image.height / bh) * 0.55)));
        const cw = el.clientWidth;
        const ch = el.clientHeight;
        const cx = ((bx + bw / 2) / image.width) * cw;
        const cy = ((by + bh / 2) / image.height) * ch;
        setView(clamp(s, cw / 2 - cx * s, ch / 2 - cy * s));
      },
    }),
    [zoomAt, clamp, image]
  );

  const btn = compact ? 'h-9 w-9' : 'h-11 w-11';
  const ic = compact ? 18 : 22;

  return (
    <div
      ref={boxRef}
      className={`relative w-full touch-none select-none overflow-hidden bg-[#1b3a4b] ${className}`}
      style={{ aspectRatio: `${image.width} / ${image.height}`, cursor: view.s > 1 ? 'grab' : 'default' }}
      onPointerDown={(e) => {
        if (view.s <= 1) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        setView((v) => clamp(v.s, d.vx + e.clientX - d.px, d.vy + e.clientY - d.py));
      }}
      onPointerUp={() => (drag.current = null)}
      onDoubleClick={() => zoomAt(2)}
    >
      <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
        <img src={getImageSrc(image)} alt={`Quadrat photo ${image.name}`} draggable={false} className="h-full w-full object-cover" />
        {showBoxes && (
          <svg viewBox={`0 0 ${image.width} ${image.height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {image.patches.map((p) => {
              const on = hover === p.id;
              return (
                <g key={p.id} onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)}>
                  <rect
                    x={p.box[0]}
                    y={p.box[1]}
                    width={p.box[2]}
                    height={p.box[3]}
                    rx={image.width * 0.012}
                    fill={on ? `${CLASS_META[p.cls].color}33` : 'transparent'}
                    stroke={CLASS_META[p.cls].color}
                    strokeWidth={on ? 3 : 2}
                    vectorEffect="non-scaling-stroke"
                  />
                  <text x={p.box[0] + image.width * 0.004} y={p.box[1] + image.width * 0.024} fontSize={image.width * 0.02} fontWeight={800} fill="#fff" stroke="#000" strokeWidth={image.width * 0.0012} paintOrder="stroke">
                    {p.id}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <button type="button" aria-label="Zoom in" onClick={() => zoomAt(1.5)} className={`flex ${btn} cursor-pointer items-center justify-center rounded-full bg-white text-[#2d3a8c] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]`}>
          <Plus size={ic} strokeWidth={3} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.5)} className={`flex ${btn} cursor-pointer items-center justify-center rounded-full bg-white text-[#2d3a8c] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]`}>
          <Minus size={ic} strokeWidth={3} />
        </button>
        <button type="button" aria-label="Reset zoom" title="Reset zoom" onClick={() => setView({ s: 1, x: 0, y: 0 })} className={`flex ${btn} cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#3b6fe0] shadow-[0_8px_18px_-6px_rgba(0,0,0,.5)] transition hover:scale-105 hover:bg-[#eef2ff]`}>
          <Maximize size={ic - 4} />
        </button>
      </div>
      {!compact && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white backdrop-blur">Scroll or use +/− to zoom · drag to pan</div>
      )}
    </div>
  );
});
PhotoViewer.displayName = 'PhotoViewer';
