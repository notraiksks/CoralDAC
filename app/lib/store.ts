/**
 * Keeps uploads across page refreshes (browser only, no server):
 * - uploaded photos + metadata live in IndexedDB
 * - review edits to the demo archive live in localStorage
 */
import { Patch, ReefImage } from './types';

const DB_NAME = 'coral-classifier';
const STORE = 'uploads';

type UploadRecord = Omit<ReefImage, 'src'> & { blob: Blob };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export async function saveUploads(imgs: ReefImage[], files: File[]) {
  try {
    for (let i = 0; i < imgs.length; i++) {
      const { src: _src, ...rest } = imgs[i];
      void _src;
      await tx('readwrite', (s) => s.put({ ...rest, blob: files[i] } as UploadRecord));
    }
  } catch {
    /* storage unavailable (private mode / quota) — the session still works */
  }
}

export async function updateUpload(img: ReefImage) {
  try {
    const rec = (await tx('readonly', (s) => s.get(img.id))) as UploadRecord | undefined;
    if (!rec) return;
    const { src: _src, ...rest } = img;
    void _src;
    await tx('readwrite', (s) => s.put({ ...rest, blob: rec.blob } as UploadRecord));
  } catch {
    /* ignore */
  }
}

export async function loadUploads(): Promise<ReefImage[]> {
  try {
    const recs = (await tx('readonly', (s) => s.getAll())) as UploadRecord[];
    return recs.map(({ blob, ...rest }) => ({ ...rest, src: URL.createObjectURL(blob) }) as ReefImage);
  } catch {
    return [];
  }
}

export async function clearUploads() {
  try {
    await tx('readwrite', (s) => s.clear());
  } catch {
    /* ignore */
  }
}

/* ---- review edits on the demo archive ---- */
const KEY = 'archive-overrides-v1';
type Overrides = Record<string, { status: ReefImage['status']; patches: Patch[] }>;

export function loadOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Overrides;
  } catch {
    return {};
  }
}
export function saveOverride(img: ReefImage) {
  try {
    const all = loadOverrides();
    all[img.id] = { status: img.status, patches: img.patches };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
