/** Client-side helpers behind the "Processing your request…" screen. */

/** The proposal mock says "less than 1MB"; field photos are usually bigger, so this is one constant to change. */
export const MAX_IMAGE_MB = 10;
export const MAX_BATCH_IMAGES = 200;

export const ACCEPT_INDIVIDUAL = '.jpg,.jpeg,.png,image/jpeg,image/png';
export const ACCEPT_BATCH = '.zip,.jpg,.jpeg,.png,image/jpeg,image/png,application/zip';

const IMAGE_RE = /\.(jpe?g|png)$/i;

export function isImageName(name: string) {
  return IMAGE_RE.test(name);
}
export function isZip(file: File) {
  return /\.zip$/i.test(file.name) || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
}

export function validateImageFile(file: File): string | null {
  if (!isImageName(file.name)) return `${file.name}: only JPG, JPEG or PNG images are supported`;
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `${file.name}: larger than ${MAX_IMAGE_MB} MB`;
  if (file.size === 0) return `${file.name}: the file is empty`;
  return null;
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export async function expandZip(zipFile: File): Promise<{ files: File[]; skipped: string[] }> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(zipFile);
  const files: File[] = [];
  const skipped: string[] = [];
  const entries = Object.values(zip.files).filter(
    (e) => !e.dir && !e.name.startsWith('__MACOSX/') && !e.name.split('/').pop()!.startsWith('.')
  );
  for (const entry of entries) {
    const base = entry.name.split('/').pop() || entry.name;
    if (!isImageName(base)) {
      skipped.push(`${base}: not a JPG/PNG image`);
      continue;
    }
    const blob = await entry.async('blob');
    files.push(new File([blob], base, { type: /png$/i.test(base) ? 'image/png' : 'image/jpeg' }));
  }
  return { files, skipped };
}

export interface ExifInfo {
  camera: string;
  lat: number | null;
  lng: number | null;
  date: string; // YYYY-MM-DD or ''
  time: string; // HH:mm or ''
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function readExif(file: File): Promise<ExifInfo> {
  const info: ExifInfo = { camera: '', lat: null, lng: null, date: '', time: '' };
  try {
    const mod: any = await import('exifr');
    const exifr = mod.default ?? mod;
    const tags: any = await exifr.parse(file, {
      pick: ['Make', 'Model', 'DateTimeOriginal', 'CreateDate'],
      reviveValues: false,
    });
    if (tags) {
      const make = String(tags.Make ?? '').trim();
      const model = String(tags.Model ?? '').trim();
      info.camera = model && make && !model.toLowerCase().startsWith(make.toLowerCase()) ? `${make} ${model}` : model || make;
      const raw = String(tags.DateTimeOriginal ?? tags.CreateDate ?? '');
      const m = raw.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2})/);
      if (m) {
        info.date = `${m[1]}-${m[2]}-${m[3]}`;
        info.time = `${m[4]}:${m[5]}`;
      }
    }
    const gps: any = await exifr.gps(file);
    if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
      info.lat = gps.latitude;
      info.lng = gps.longitude;
    }
  } catch {
    // no EXIF (e.g. PNG or stripped metadata) — the user fills the fields in on the next screen
  }
  return info;
}

/** Pixel size of an image (decodes it once, which also proves it is readable). Quality warnings were dropped (Rai, 2026-11-10). */
export async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const out = { width: bmp.width, height: bmp.height };
  bmp.close();
  return out;
}
