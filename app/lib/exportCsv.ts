import { CLASS_META, CLASS_ORDER, ReefImage } from './types';
import { coverOf, dominantOf } from './reefMath';

function esc(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = '\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportImagesCsv(images: ReefImage[], filename = 'coral-images.csv') {
  const head = ['image_id', 'file_name', 'station', 'transect', 'quadrat', 'latitude', 'longitude', 'captured_at', 'camera', 'status', 'patches', ...CLASS_ORDER.map((k) => `${CLASS_META[k].short}_cover_pct`), 'dominant_class'];
  const rows = images.map((i) => {
    const c = coverOf(i.patches);
    return [i.id, i.name, i.location, i.transect, i.quadrat, i.lat.toFixed(6), i.lng.toFixed(6), i.capturedAt, i.camera, i.status, i.patches.length, ...CLASS_ORDER.map((k) => c[k].toFixed(1)), CLASS_META[dominantOf(i)].short];
  });
  downloadCsv(filename, [head, ...rows]);
}

export function exportPatchesCsv(img: ReefImage) {
  const head = ['image', 'patch_id', 'class', 'confidence', 'x', 'y', 'w', 'h', 'area_pct'];
  const rows = img.patches.map((p) => [img.name, p.id, CLASS_META[p.cls].short, p.confidence.toFixed(2), ...p.box, p.areaPct.toFixed(1)]);
  downloadCsv(`${img.name.replace(/\.[^.]+$/, '')}-patches.csv`, [head, ...rows]);
}
