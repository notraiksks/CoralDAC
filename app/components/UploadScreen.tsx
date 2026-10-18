'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Check, FileArchive, ImageIcon, ScanSearch, Send, Sparkles, X } from 'lucide-react';
import { Patch, ReefImage, ReefStation } from '../lib/types';
import {
  ACCEPT_BATCH,
  ACCEPT_INDIVIDUAL,
  MAX_BATCH_IMAGES,
  MAX_IMAGE_MB,
  assessQuality,
  expandZip,
  formatBytes,
  isImageName,
  isZip,
  readExif,
  validateImageFile,
} from '../lib/ingest';
import { classifyImage } from '../lib/classify';
import { createSamplePhoto } from '../lib/samplePhoto';
import { inPhilippines, nearestStation } from '../lib/geo';
import { GhostButton, PrimaryButton, Spinner } from './ui';

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center rounded-2xl bg-[#e7eaf0] text-sm text-[#6b7280]">Loading map…</div>,
});

interface Draft {
  key: string;
  file: File;
  name: string;
  src: string;
  width: number;
  height: number;
  camera: string;
  lat: string;
  lng: string;
  date: string;
  time: string;
  fromExif: { camera: boolean; gps: boolean; datetime: boolean };
  stationId: string;
  location: string;
  transect: string;
  quadrat: string;
  warnings: string[];
  patches: Patch[];
  simulated: boolean;
}

type Stage = 'select' | 'processing' | 'specifics';
const STEPS = ['Uploading image', 'Extracting data', 'Reviewing image quality', 'Classifying coral'];
const AUTO_ASSIGN_KM = 3;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const linger = () => new Promise<void>((r) => setTimeout(r, 350)); // so each step is readable, even for one small photo

function parseCoord(s: string): number | null {
  const n = Number(s.trim());
  return s.trim() !== '' && Number.isFinite(n) ? n : null;
}

function draftErrors(d: Draft): string[] {
  const errs: string[] = [];
  const lat = parseCoord(d.lat);
  const lng = parseCoord(d.lng);
  if (lat == null || lng == null) errs.push('Location (latitude & longitude) is required');
  else if (!inPhilippines(lat, lng)) errs.push('Coordinates are outside the Philippines');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) errs.push('Date is required');
  if (!(parseInt(d.quadrat, 10) > 0)) errs.push('Quadrat number must be 1 or more');
  return errs;
}

interface Props {
  stations: ReefStation[];
  existing: ReefImage[];
  onSaved: (imgs: ReefImage[], files: File[]) => void;
}

export const UploadScreen: React.FC<Props> = ({ stations, existing, onSaved }) => {
  const [mode, setMode] = useState<'individual' | 'batch'>('individual');
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>('select');
  const [prog, setProg] = useState({ step: 0, done: 0, total: 1 });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const abortRef = useRef(false);
  const urlsRef = useRef<string[]>([]);

  const previewUrl = useMemo(() => (mode === 'individual' && files[0] ? URL.createObjectURL(files[0]) : null), [files, mode]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const resetAll = (revoke: boolean) => {
    if (revoke) urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setFiles([]);
    setDrafts([]);
    setSkipped([]);
    setConfirm(false);
    setShowErrors(false);
    setNotice(null);
    setStage('select');
  };

  /* ---------- file selection ---------- */
  const takeFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    setNotice(null);
    if (mode === 'individual') {
      if (incoming.some(isZip)) return setNotice('ZIP archives are handled by Batch Upload — switch the toggle below.');
      const f = incoming[0];
      const err = validateImageFile(f);
      if (err) return setNotice(err);
      if (incoming.length > 1) setNotice('Only one image can be uploaded at a time here — use Batch Upload for several.');
      setFiles([f]);
    } else {
      const ok = incoming.filter((f) => isZip(f) || isImageName(f.name));
      if (ok.length < incoming.length) setNotice('Some files were ignored — only .zip, JPG, JPEG and PNG are accepted.');
      setFiles((prev) => [...prev, ...ok]);
    }
  };

  const switchMode = (m: 'individual' | 'batch') => {
    if (m === mode) return;
    setMode(m);
    setFiles([]);
    setNotice(null);
  };

  /* ---------- processing pipeline ---------- */
  const nextQuadrat = (stationId: string, taken: Draft[]) => {
    const nums = [
      ...existing.filter((i) => i.stationId === stationId).map((i) => i.quadrat),
      ...taken.filter((d) => d.stationId === stationId).map((d) => parseInt(d.quadrat, 10) || 0),
    ];
    return (nums.length ? Math.max(...nums) : 0) + 1;
  };

  const run = async () => {
    abortRef.current = false;
    setNotice(null);
    setStage('processing');
    const skippedLocal: string[] = [];
    const created: string[] = [];
    const aborted = () => {
      if (!abortRef.current) return false;
      created.forEach((u) => URL.revokeObjectURL(u));
      setStage('select');
      return true;
    };

    // 1 — uploading / unpacking
    setProg({ step: 0, done: 0, total: files.length });
    const list: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (isZip(f)) {
        try {
          const r = await expandZip(f);
          list.push(...r.files);
          skippedLocal.push(...r.skipped);
        } catch {
          skippedLocal.push(`${f.name}: could not read this ZIP archive`);
        }
      } else list.push(f);
      setProg({ step: 0, done: i + 1, total: files.length });
      await tick();
    }
    let valid: File[] = [];
    for (const f of list) {
      const err = validateImageFile(f);
      if (err) skippedLocal.push(err);
      else valid.push(f);
    }
    if (valid.length > MAX_BATCH_IMAGES) {
      skippedLocal.push(`Only the first ${MAX_BATCH_IMAGES} images were kept (${valid.length - MAX_BATCH_IMAGES} skipped)`);
      valid = valid.slice(0, MAX_BATCH_IMAGES);
    }
    if (!valid.length) {
      setSkipped(skippedLocal);
      setNotice(skippedLocal[0] ?? 'No usable images were found.');
      setStage('select');
      return;
    }
    await linger();
    if (aborted()) return;
    const items = valid.map((file) => {
      const src = URL.createObjectURL(file);
      created.push(src);
      return { file, src };
    });

    // 2 — EXIF
    const exifs = [];
    setProg({ step: 1, done: 0, total: items.length });
    for (let i = 0; i < items.length; i++) {
      if (aborted()) return;
      exifs.push(await readExif(items[i].file));
      setProg({ step: 1, done: i + 1, total: items.length });
      await tick();
    }

    await linger();

    // 3 — quality
    const quals: Awaited<ReturnType<typeof assessQuality>>[] = [];
    const usable: number[] = [];
    setProg({ step: 2, done: 0, total: items.length });
    for (let i = 0; i < items.length; i++) {
      if (aborted()) return;
      try {
        quals[i] = await assessQuality(items[i].file);
        usable.push(i);
      } catch {
        skippedLocal.push(`${items[i].file.name}: could not be read as an image`);
        URL.revokeObjectURL(items[i].src);
      }
      setProg({ step: 2, done: i + 1, total: items.length });
      await tick();
    }
    await linger();
    if (!usable.length) {
      setSkipped(skippedLocal);
      setNotice('None of the images could be read.');
      setStage('select');
      return;
    }

    // 4 — classification
    const results: Record<number, Awaited<ReturnType<typeof classifyImage>>> = {};
    setProg({ step: 3, done: 0, total: usable.length });
    for (let n = 0; n < usable.length; n++) {
      if (aborted()) return;
      const i = usable[n];
      results[i] = await classifyImage(items[i].file, { width: quals[i].width, height: quals[i].height });
      setProg({ step: 3, done: n + 1, total: usable.length });
      await tick();
    }

    await linger();

    // build the editable drafts
    const out: Draft[] = [];
    for (const i of usable) {
      const ex = exifs[i];
      const near = ex.lat != null && ex.lng != null ? nearestStation(stations, ex.lat, ex.lng) : null;
      const stationId = near && near.km <= AUTO_ASSIGN_KM ? near.station.id : '';
      out.push({
        key: `${items[i].file.name}-${i}`,
        file: items[i].file,
        name: items[i].file.name,
        src: items[i].src,
        width: quals[i].width,
        height: quals[i].height,
        camera: ex.camera,
        lat: ex.lat != null ? ex.lat.toFixed(6) : '',
        lng: ex.lng != null ? ex.lng.toFixed(6) : '',
        date: ex.date,
        time: ex.time,
        fromExif: { camera: !!ex.camera, gps: ex.lat != null, datetime: !!ex.date },
        stationId,
        location: '',
        transect: 'T1',
        quadrat: stationId ? String(nextQuadrat(stationId, out)) : '1',
        warnings: quals[i].report.warnings,
        patches: results[i].patches,
        simulated: results[i].simulated,
      });
    }
    urlsRef.current = created;
    setSkipped(skippedLocal);
    setDrafts(out);
    setConfirm(false);
    setShowErrors(false);
    setStage('specifics');
  };

  /* ---------- draft editing ---------- */
  const patchDraft = (key: string, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  // pure helper so several images can be assigned in one update (each gets the next free quadrat number)
  const withStation = (ds: Draft[], key: string, stationId: string): Draft[] =>
    ds.map((d) => {
      if (d.key !== key) return d;
      const st = stations.find((x) => x.id === stationId);
      const next: Draft = { ...d, stationId };
      if (st) {
        if (!d.lat.trim() && !d.lng.trim()) {
          next.lat = st.lat.toFixed(6);
          next.lng = st.lng.toFixed(6);
        }
        next.quadrat = String(nextQuadrat(stationId, ds.filter((x) => x.key !== key)));
      }
      return next;
    });

  const chooseStation = (d: Draft, stationId: string) => setDrafts((ds) => withStation(ds, d.key, stationId));

  const applyStationToMissing = (stationId: string) =>
    setDrafts((ds) =>
      ds.filter((d) => !d.lat.trim() || !d.lng.trim()).reduce((acc, d) => withStation(acc, d.key, stationId), ds)
    );

  const errorsByKey = useMemo(() => new Map(drafts.map((d) => [d.key, draftErrors(d)])), [drafts]);
  const totalErrors = [...errorsByKey.values()].reduce((s, e) => s + e.length, 0);
  const missingGps = drafts.filter((d) => !d.fromExif.gps && (!d.lat || !d.lng)).length;

  const proceed = () => {
    if (!confirm) return;
    if (totalErrors > 0) {
      setShowErrors(true);
      return;
    }
    const stamp = Date.now().toString(36);
    const out: ReefImage[] = drafts.map((d, i) => {
      const st = stations.find((s) => s.id === d.stationId);
      return {
        id: `UP-${stamp}-${i}`,
        name: d.name,
        src: d.src,
        width: d.width,
        height: d.height,
        stationId: st ? st.id : null,
        location: st ? st.name : d.location.trim() || 'Unassigned location',
        transect: d.transect.trim() || 'T1',
        quadrat: parseInt(d.quadrat, 10) || 1,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lng),
        capturedAt: `${d.date}T${d.time || '00:00'}`,
        camera: d.camera.trim(),
        patches: d.patches,
        source: 'upload',
        status: 'pending',
        simulated: d.simulated,
      };
    });
    urlsRef.current = []; // the saved images own these object URLs now
    onSaved(out, drafts.map((d) => d.file));
    resetAll(false);
  };

  /* ================= render ================= */
  return (
    <div className={`reef-rise mx-auto w-full px-4 pb-12 pt-8 ${stage === 'specifics' && drafts.length > 1 ? 'max-w-[1240px]' : 'max-w-[860px]'}`}>
      <Stepper step={stage === 'specifics' ? 1 : 0} />

      {stage === 'select' && (
        <SelectStage
          mode={mode}
          files={files}
          previewUrl={previewUrl}
          notice={notice}
          skipped={skipped}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onFiles={takeFiles}
          onRemove={(i) => setFiles((f) => f.filter((_, k) => k !== i))}
          onClear={() => setFiles([])}
          onMode={switchMode}
          onClassify={run}
          onSample={async () => takeFiles([await createSamplePhoto()])}
        />
      )}

      {stage === 'processing' && (
        <ProcessingStage prog={prog} batch={files.length > 1 || files.some(isZip)} onCancel={() => (abortRef.current = true)} />
      )}

      {stage === 'specifics' && (
        <div>
          <h2 className="font-display mb-4 text-[17px] font-semibold text-[#1f2430]">
            {drafts.length === 1 ? 'The following data was obtained from your upload:' : `We read ${drafts.length} images. Please check the data we obtained:`}
          </h2>

          {skipped.length > 0 && (
            <details className="mb-3 rounded-2xl border border-[#f0d58a] bg-[#fff8e1] px-3 py-2 text-[12.5px] text-[#6a4d00]">
              <summary className="cursor-pointer font-semibold">{skipped.length} file(s) were skipped</summary>
              <ul className="mt-1 list-disc pl-5">{skipped.slice(0, 20).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </details>
          )}

          {drafts.length === 1 ? (
            <SingleSpecifics d={drafts[0]} stations={stations} errors={showErrors ? errorsByKey.get(drafts[0].key) ?? [] : []} onChange={(p) => patchDraft(drafts[0].key, p)} onStation={(id) => chooseStation(drafts[0], id)} />
          ) : (
            <BatchSpecifics
              drafts={drafts}
              stations={stations}
              showErrors={showErrors}
              errorsByKey={errorsByKey}
              missingGps={missingGps}
              onChange={patchDraft}
              onStation={chooseStation}
              onApplyStation={applyStationToMissing}
              onApplyDate={(date, time) =>
                setDrafts((ds) => ds.map((d) => (d.date ? d : { ...d, date, time: d.time || time })))
              }
            />
          )}

          {drafts.some((d) => d.simulated) && (
            <p className="mt-3 rounded-2xl bg-[#eef2ff] px-3 py-2 text-[12px] text-[#3b4a7a]">
              Demo mode: coral patches are <b>simulated</b> until the YOLOv8 + ResNet50 API is connected (set <code>NEXT_PUBLIC_API_URL</code>).
            </p>
          )}

          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-[28px] bg-[var(--card)] px-4 py-3 text-[13px] shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)]">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="round-check" />
            <span>All of the information listed above is accurate</span>
          </label>

          {showErrors && totalErrors > 0 && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#c62828]">
              <AlertTriangle size={14} /> Please fix the highlighted fields ({totalErrors} problem{totalErrors > 1 ? 's' : ''}) before continuing.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <GhostButton icon={<X size={14} />} onClick={() => resetAll(true)}>
              Start over
            </GhostButton>
            <PrimaryButton icon={<Send size={14} />} disabled={!confirm} onClick={proceed}>
              Proceed
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= step indicator ================= */

const Stepper: React.FC<{ step: number }> = ({ step }) => {
  const labels = ['Choose photo', 'Confirm details', 'Review results'];
  return (
    <ol className="mb-6 flex items-center justify-center gap-2 text-[12px] font-semibold sm:gap-3" aria-label="Progress">
      {labels.map((l, i) => {
        const done = i < step;
        const on = i === step;
        return (
          <React.Fragment key={l}>
            {i > 0 && <li aria-hidden="true" className={`h-0.5 w-6 rounded-full sm:w-14 ${i <= step ? 'bg-[#3b6fe0]' : 'bg-[#d5daf0]'}`} />}
            <li className={`flex items-center gap-2 ${on ? 'text-[#2d3a8c]' : done ? 'text-[#3a9d3a]' : 'text-[#9aa0ad]'}`} aria-current={on ? 'step' : undefined}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition ${on ? 'bg-gradient-to-br from-[#4a44b5] to-[#3b6fe0] text-white shadow-[0_6px_14px_-4px_rgba(59,70,200,.7)]' : done ? 'bg-[#3a9d3a] text-white' : 'bg-white text-[#9aa0ad] ring-1 ring-[#d5daf0]'}`}>
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{l}</span>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
};

/* ================= stage 1: select ================= */

const SelectStage: React.FC<{
  mode: 'individual' | 'batch';
  files: File[];
  previewUrl: string | null;
  notice: string | null;
  skipped: string[];
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFiles: (f: File[]) => void;
  onRemove: (i: number) => void;
  onClear: () => void;
  onMode: (m: 'individual' | 'batch') => void;
  onClassify: () => void;
  onSample: () => Promise<void>;
}> = ({ mode, files, previewUrl, notice, dragOver, setDragOver, onFiles, onRemove, onClear, onMode, onClassify, onSample }) => {
  const [sampling, setSampling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const total = files.reduce((s, f) => s + f.size, 0);
  return (
    <div>
      <h2 className="font-display mb-3 text-[15px] font-semibold tracking-wide text-[#1f2430]">UPLOAD YOUR IMAGE:</h2>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFiles(Array.from(e.dataTransfer.files));
        }}
        className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[36px] border-2 border-dashed px-6 py-8 text-center shadow-[0_18px_40px_-20px_rgba(52,62,140,.5)] transition focus-within:ring-2 focus-within:ring-[var(--primary)] ${
          dragOver ? 'scale-[1.01] border-[#3b6fe0] bg-[#eef2ff]' : 'border-[#c3cdf3] bg-white hover:border-[#8fa3ec] hover:bg-[#f7f9ff]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={mode === 'individual' ? ACCEPT_INDIVIDUAL : ACCEPT_BATCH}
          multiple={mode === 'batch'}
          onChange={(e) => {
            onFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        {mode === 'individual' && previewUrl ? (
          <img src={previewUrl} alt="Selected photo preview" className="mb-4 h-36 w-36 rounded-full object-cover shadow-[0_12px_26px_-10px_rgba(0,0,0,.6)] ring-4 ring-white" />
        ) : mode === 'batch' ? (
          <span className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#e6ebff] to-[#d3f1ea] text-[#3f58b0] shadow-inner"><FileArchive size={32} aria-hidden="true" /></span>
        ) : (
          <span className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#e6ebff] to-[#d3f1ea] text-[#3f58b0] shadow-inner"><ImageIcon size={32} aria-hidden="true" /></span>
        )}
        <p className="text-[12.5px]">
          <span className="font-bold text-[var(--primary)]">{files.length ? 'Click to replace' : 'Click to upload'}</span>{' '}
          <span className="text-[#2d3340]">or drag and drop</span>
        </p>
        <p className="mt-1 text-[11px] text-[#9aa0ad]">
          {mode === 'individual'
            ? `JPG, JPEG, PNG up to ${MAX_IMAGE_MB} MB`
            : `.zip of images (or several JPG/PNG files) · up to ${MAX_BATCH_IMAGES} images`}
        </p>
      </label>

      {files.length === 0 && (
        <div className="mt-3 text-center">
          <button
            type="button"
            disabled={sampling}
            onClick={async () => {
              setSampling(true);
              try {
                await onSample();
              } finally {
                setSampling(false);
              }
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-semibold text-[#3f58b0] shadow-sm ring-1 ring-[#dfe4f8] transition hover:bg-[#eef2ff] disabled:opacity-50"
          >
            <Sparkles size={14} /> {sampling ? 'Preparing…' : 'No photo handy? Try a sample photo'}
          </button>
        </div>
      )}

      {notice && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-[12.5px] font-semibold text-[#c62828]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {notice}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-3 rounded-3xl bg-white px-4 py-2.5 text-[12.5px] shadow-[0_8px_22px_-14px_rgba(52,62,140,.45)] ring-1 ring-[#e3e7f6]">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {files.length} file{files.length > 1 ? 's' : ''} selected · {formatBytes(total)}
            </span>
            <button type="button" onClick={onClear} className="cursor-pointer text-[#c62828] hover:underline">
              Remove all
            </button>
          </div>
          <ul className="mt-1 max-h-28 space-y-0.5 overflow-auto text-[#4b5160]">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{f.name} <span className="text-[#9aa0ad]">({formatBytes(f.size)})</span></span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onRemove(i)} className="cursor-pointer text-[#9aa0ad] hover:text-[#c62828]">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 rounded-full bg-white p-1.5 text-[13px] shadow-[0_12px_30px_-14px_rgba(52,62,140,.45)] ring-1 ring-[#e3e7f6]" role="radiogroup" aria-label="Upload type">
        {(['individual', 'batch'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => onMode(m)}
            className={`cursor-pointer rounded-full px-3 py-2.5 transition ${mode === m ? 'bg-gradient-to-r from-[#e8ecff] to-[#d9f2ec] font-bold text-[#1f2430] shadow-sm' : 'font-medium text-[#9aa0ad] hover:text-[#4b5160]'}`}
          >
            {m === 'individual' ? 'Individual Upload' : 'Batch Upload'}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px] text-[#6b7280]">Photos with GPS and date embedded (EXIF) are located automatically — you can check everything on the next screen.</p>
        <PrimaryButton icon={<ScanSearch size={15} />} disabled={files.length === 0} onClick={onClassify}>
          Classify
        </PrimaryButton>
      </div>
    </div>
  );
};

/* ================= stage 2: processing ================= */

const ProcessingStage: React.FC<{
  prog: { step: number; done: number; total: number };
  batch: boolean;
  onCancel: () => void;
}> = ({ prog, batch, onCancel }) => (
  <div aria-live="polite">
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[28px] bg-[var(--card)] shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)]">
      <Spinner size={38} />
      <p className="mt-4 text-[12.5px] font-semibold">Processing your request...</p>
      {batch && (
        <div className="mt-3 h-1.5 w-56 overflow-hidden rounded-full bg-[#e1e4ec]">
          <div className="h-full bg-[#3b6fe0] transition-all" style={{ width: `${((prog.step + prog.done / Math.max(1, prog.total)) / STEPS.length) * 100}%` }} />
        </div>
      )}
    </div>
    <ol className="mt-4 grid grid-cols-2 gap-3 rounded-[28px] bg-[var(--card)] px-4 py-4 text-[12px] shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)] sm:grid-cols-4">
      {STEPS.map((label, i) => {
        const done = i < prog.step;
        const run = i === prog.step;
        return (
          <li key={label} className={`flex items-center justify-center gap-2 ${done || run ? 'text-[#1f2430]' : 'text-[#a0a4ae]'}`}>
            {done ? (
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#3a9d3a] text-white"><Check size={12} strokeWidth={3} /></span>
            ) : run ? (
              <Spinner />
            ) : (
              <span className="h-[18px] w-[18px] rounded-full border-2 border-[#d5d9e2]" />
            )}
            <span className="font-medium">
              {label}
              {batch && run && <span className="text-[#6b7280]"> ({prog.done}/{prog.total})</span>}
            </span>
          </li>
        );
      })}
    </ol>
    <div className="mt-4 flex justify-end">
      <GhostButton onClick={onCancel}>Cancel</GhostButton>
    </div>
  </div>
);

/* ================= stage 3: specifics ================= */

const inputCls = (bad: boolean) =>
  `w-full rounded-2xl border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[#3b6fe0] ${bad ? 'border-[#e57373] bg-[#fff5f5]' : 'border-[#d5d9e2]'}`;

const Extracted: React.FC<{ ok: boolean; missing?: string }> = ({ ok, missing = 'Not found in the photo — please enter' }) =>
  ok ? <span className="text-[11px] italic text-[#8a8f9c]">(as extracted)</span> : <span className="text-[11px] font-semibold text-[#b26a00]">{missing}</span>;

const SingleSpecifics: React.FC<{
  d: Draft;
  stations: ReefStation[];
  errors: string[];
  onChange: (p: Partial<Draft>) => void;
  onStation: (id: string) => void;
}> = ({ d, stations, errors, onChange, onStation }) => {
  const lat = parseCoord(d.lat);
  const lng = parseCoord(d.lng);
  const near = lat != null && lng != null ? nearestStation(stations, lat, lng) : null;
  const suggest = near && near.station.id !== d.stationId && near.km <= 25 ? near : null;
  const bad = (needle: string) => errors.some((e) => e.toLowerCase().includes(needle));

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="rounded-[28px] bg-[var(--card)] p-5 shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)]" aria-label="Specifics">
        <h3 className="font-display mb-3 text-[17px] font-semibold tracking-wide">SPECIFICS</h3>
        <div className="space-y-3 text-[12.5px]">
          <Field label="Image Name"><div className="break-all font-medium italic">{d.name}</div></Field>

          <Field label="Camera Name" hint={<Extracted ok={d.fromExif.camera} missing="Not in photo data — optional" />}>
            <input className={inputCls(false)} value={d.camera} onChange={(e) => onChange({ camera: e.target.value })} placeholder="e.g. GoPro HERO11 Black" />
          </Field>

          <Field label="Location">
            <select className={inputCls(false)} value={d.stationId} onChange={(e) => onStation(e.target.value)} aria-label="Survey station">
              <option value="">Other location (not a listed station)</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.area}</option>
              ))}
            </select>
            {!d.stationId && (
              <input className={`${inputCls(false)} mt-1.5`} value={d.location} onChange={(e) => onChange({ location: e.target.value })} placeholder="Location name (optional)" />
            )}
            {suggest && (
              <p className="mt-1 text-[11.5px] text-[#4b5160]">
                Nearest station: <b>{suggest.station.name}</b> ({suggest.km < 1 ? `${Math.round(suggest.km * 1000)} m` : `${suggest.km.toFixed(1)} km`} away){' '}
                <button type="button" onClick={() => onStation(suggest.station.id)} className="cursor-pointer font-semibold text-[#3b6fe0] hover:underline">Use it</button>
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" hint={<Extracted ok={d.fromExif.gps} />}>
              <input className={inputCls(bad('location') || bad('outside'))} inputMode="decimal" value={d.lat} onChange={(e) => onChange({ lat: e.target.value })} placeholder="13.519400" aria-label="Latitude" />
            </Field>
            <Field label="Longitude">
              <input className={inputCls(bad('location') || bad('outside'))} inputMode="decimal" value={d.lng} onChange={(e) => onChange({ lng: e.target.value })} placeholder="120.955600" aria-label="Longitude" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" hint={<Extracted ok={d.fromExif.datetime} />}>
              <input type="date" className={inputCls(bad('date'))} value={d.date} onChange={(e) => onChange({ date: e.target.value })} aria-label="Date" />
            </Field>
            <Field label="Time">
              <input type="time" className={inputCls(false)} value={d.time} onChange={(e) => onChange({ time: e.target.value })} aria-label="Time" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-[#e1e4ec] pt-3">
            <Field label="Transect">
              <input className={inputCls(false)} value={d.transect} onChange={(e) => onChange({ transect: e.target.value })} placeholder="T1" />
            </Field>
            <Field label="Quadrat Number">
              <input className={inputCls(bad('quadrat'))} inputMode="numeric" value={d.quadrat} onChange={(e) => onChange({ quadrat: e.target.value.replace(/\D/g, '') })} />
            </Field>
          </div>
        </div>

        {errors.length > 0 && (
          <ul className="mt-3 space-y-0.5 text-[12px] font-semibold text-[#c62828]" role="alert">
            {errors.map((e) => <li key={e}>• {e}</li>)}
          </ul>
        )}
      </section>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-[28px] bg-[var(--card)] shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)]">
          <img src={d.src} alt="Uploaded photo" className="max-h-56 w-full object-cover" />
          <div className="px-4 py-2 text-[11.5px] text-[#4b5160]">{d.width.toLocaleString()} × {d.height.toLocaleString()} px · {d.patches.length} coral patches found</div>
        </div>
        {d.warnings.length > 0 && (
          <div className="rounded-[28px] border border-[#f0d58a] bg-[#fff8e1] p-3 text-[12.5px] text-[#6a4d00]">
            <p className="mb-1 flex items-center gap-1.5 font-bold"><AlertTriangle size={14} /> Image quality</p>
            <ul className="list-disc pl-5">{d.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
        )}
        <div className="rounded-[28px] bg-[var(--card)] p-3 shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)]">
          <p className="mb-2 text-[12px] font-bold">Pin the location <span className="font-normal text-[#6b7280]">— click the map or drag the pin</span></p>
          <div className="h-56">
            <LocationPicker lat={lat} lng={lng} onChange={(la, ln) => onChange({ lat: la.toFixed(6), lng: ln.toFixed(6) })} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <div className="mb-1 flex items-baseline gap-2">
      <span className="font-bold">{label}:</span>
      {hint}
    </div>
    {children}
  </div>
);

const BatchSpecifics: React.FC<{
  drafts: Draft[];
  stations: ReefStation[];
  showErrors: boolean;
  errorsByKey: Map<string, string[]>;
  missingGps: number;
  onChange: (key: string, p: Partial<Draft>) => void;
  onStation: (d: Draft, id: string) => void;
  onApplyStation: (id: string) => void;
  onApplyDate: (date: string, time: string) => void;
}> = ({ drafts, stations, showErrors, errorsByKey, missingGps, onChange, onStation, onApplyStation, onApplyDate }) => {
  const [bulk, setBulk] = useState('');
  const [bulkDate, setBulkDate] = useState('');
  const [bulkTime, setBulkTime] = useState('');
  const missingDate = drafts.filter((d) => !d.date).length;
  const cell = (bad: boolean) => `w-full min-w-0 rounded-lg border px-1.5 py-1 text-[12px] outline-none focus:ring-2 focus:ring-[#3b6fe0] ${bad ? 'border-[#e57373] bg-[#fff5f5]' : 'border-[#d5d9e2] bg-white'}`;
  return (
    <div className="rounded-[28px] bg-[var(--card)] p-4 shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-extrabold">SPECIFICS <span className="text-[12px] font-medium text-[#6b7280]">· {drafts.length} images</span></h3>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {missingDate > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="font-semibold text-[#b26a00]">{missingDate} without a date:</span>
            <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="rounded-lg border border-[#d5d9e2] bg-white px-2 py-1" aria-label="Date for images without a date" />
            <input type="time" value={bulkTime} onChange={(e) => setBulkTime(e.target.value)} className="rounded-lg border border-[#d5d9e2] bg-white px-2 py-1" aria-label="Time for images without a date" />
            <GhostButton disabled={!bulkDate} onClick={() => onApplyDate(bulkDate, bulkTime)}>Apply to them</GhostButton>
          </div>
        )}
        {missingGps > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="font-semibold text-[#b26a00]">{missingGps} without a location:</span>
            <select value={bulk} onChange={(e) => setBulk(e.target.value)} className="rounded-lg border border-[#d5d9e2] bg-white px-2 py-1" aria-label="Station for images without a location">
              <option value="">Choose a station…</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <GhostButton disabled={!bulk} onClick={() => onApplyStation(bulk)}>Apply to them</GhostButton>
          </div>
        )}
        </div>
      </div>
      <div className="max-h-[56vh] overflow-auto rounded-2xl border border-[#e1e4ec] bg-white reef-scroll">
        <table className="w-full min-w-[980px] border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-[#f3f4f8] text-[11px] uppercase tracking-wide text-[#4b5160]">
            <tr>
              <th className="px-2 py-2">Photo</th>
              <th className="px-2 py-2">Image name</th>
              <th className="px-2 py-2">Camera</th>
              <th className="px-2 py-2">Station</th>
              <th className="px-2 py-2">Latitude</th>
              <th className="px-2 py-2">Longitude</th>
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Time</th>
              <th className="px-2 py-2">Transect</th>
              <th className="px-2 py-2">Quad #</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => {
              const errs = showErrors ? errorsByKey.get(d.key) ?? [] : [];
              const locBad = errs.some((e) => /location|outside/i.test(e));
              const near = d.stationId ? null : (() => {
                const la = parseCoord(d.lat), ln = parseCoord(d.lng);
                return la != null && ln != null ? nearestStation(stations, la, ln) : null;
              })();
              return (
                <tr key={d.key} className="border-t border-[#eceef3] align-top">
                  <td className="px-2 py-1.5">
                    <div className="relative h-10 w-14 overflow-hidden rounded-lg">
                      <img src={d.src} alt="" className="h-full w-full object-cover" />
                      {d.warnings.length > 0 && <span title={d.warnings.join('; ')} className="absolute right-0 top-0 rounded-bl bg-[#f5c026] p-0.5 text-[#6a4d00]"><AlertTriangle size={10} /></span>}
                    </div>
                  </td>
                  <td className="max-w-[160px] break-all px-2 py-1.5 font-medium">{d.name}</td>
                  <td className="px-2 py-1.5"><input className={cell(false)} value={d.camera} onChange={(e) => onChange(d.key, { camera: e.target.value })} aria-label={`Camera for ${d.name}`} /></td>
                  <td className="px-2 py-1.5">
                    <select className={cell(false)} value={d.stationId} onChange={(e) => onStation(d, e.target.value)} aria-label={`Station for ${d.name}`}>
                      <option value="">Other…</option>
                      {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {!d.stationId && near && near.km <= 25 && (
                      <button type="button" onClick={() => onStation(d, near.station.id)} className="mt-0.5 cursor-pointer text-[10.5px] font-semibold text-[#3b6fe0] hover:underline">
                        Nearest: {near.station.name} ({near.km.toFixed(1)} km)
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-1.5"><input className={cell(locBad)} inputMode="decimal" value={d.lat} onChange={(e) => onChange(d.key, { lat: e.target.value })} aria-label={`Latitude for ${d.name}`} placeholder={d.fromExif.gps ? '' : 'required'} /></td>
                  <td className="px-2 py-1.5"><input className={cell(locBad)} inputMode="decimal" value={d.lng} onChange={(e) => onChange(d.key, { lng: e.target.value })} aria-label={`Longitude for ${d.name}`} placeholder={d.fromExif.gps ? '' : 'required'} /></td>
                  <td className="px-2 py-1.5"><input type="date" className={cell(errs.some((e) => /date/i.test(e)))} value={d.date} onChange={(e) => onChange(d.key, { date: e.target.value })} aria-label={`Date for ${d.name}`} /></td>
                  <td className="px-2 py-1.5"><input type="time" className={cell(false)} value={d.time} onChange={(e) => onChange(d.key, { time: e.target.value })} aria-label={`Time for ${d.name}`} /></td>
                  <td className="px-2 py-1.5"><input className={`${cell(false)} w-16`} value={d.transect} onChange={(e) => onChange(d.key, { transect: e.target.value })} aria-label={`Transect for ${d.name}`} /></td>
                  <td className="px-2 py-1.5"><input className={`${cell(errs.some((e) => /quadrat/i.test(e)))} w-16`} inputMode="numeric" value={d.quadrat} onChange={(e) => onChange(d.key, { quadrat: e.target.value.replace(/\D/g, '') })} aria-label={`Quadrat for ${d.name}`} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11.5px] text-[#6b7280]">Fields shown empty were not found in the photo’s metadata. Every image needs coordinates inside the Philippines and a date.</p>
    </div>
  );
};

