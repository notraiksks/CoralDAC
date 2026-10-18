import { CLASS_ORDER, CoralClass, Patch } from './types';
import { hashString, mulberry32 } from './imageArt';

/**
 * Classification entry point.
 *
 * - If NEXT_PUBLIC_API_URL is set, the image is POSTed (multipart field "file") to
 *   `${NEXT_PUBLIC_API_URL}/classify`, expected to answer
 *   `{ patches: [{ class: "LC"|"PB"|"DC"|"DCA", confidence: 0.93, box: [x, y, w, h] }] }`
 *   (YOLOv8 boxes in image pixels + ResNet50 class).
 * - Otherwise (or if the call fails) a deterministic *simulated* result is returned and
 *   flagged `simulated: true`, so the UI can say so.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function classifyImage(
  file: File,
  dims: { width: number; height: number }
): Promise<{ patches: Patch[]; simulated: boolean }> {
  if (API_URL) {
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/classify`, { method: 'POST', body });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const patches: Patch[] = (json.patches ?? []).map((p: any, i: number) => {
        const cls = String(p.class ?? p.cls ?? 'lc').toLowerCase() as CoralClass;
        const [x, y, w, h] = p.box as [number, number, number, number];
        return {
          id: `P-${String(i + 1).padStart(2, '0')}`,
          cls: CLASS_ORDER.includes(cls) ? cls : 'lc',
          confidence: Math.round(Number(p.confidence) * 100) / 100,
          box: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)],
          areaPct: Math.round(((w * h) / (dims.width * dims.height)) * 1000) / 10,
        };
      });
      return { patches, simulated: false };
    } catch {
      // fall through to the simulation
    }
  }
  return { patches: simulate(file, dims), simulated: true };
}

function simulate(file: File, { width, height }: { width: number; height: number }): Patch[] {
  const rnd = mulberry32(hashString(`${file.name}:${file.size}`));
  const weights: Record<CoralClass, number> = { lc: 0.4, pb: 0.25, dc: 0.2, dca: 0.15 };
  const n = 4 + Math.floor(rnd() * 5);
  const patches: Patch[] = [];
  for (let i = 0; i < n; i++) {
    let r = rnd();
    let cls: CoralClass = 'lc';
    for (const k of CLASS_ORDER) {
      r -= weights[k];
      if (r <= 0) {
        cls = k;
        break;
      }
    }
    const w = Math.round(width * (0.12 + rnd() * 0.16));
    const h = Math.round(height * (0.14 + rnd() * 0.17));
    const x = Math.round(rnd() * (width - w));
    const y = Math.round(rnd() * (height - h));
    patches.push({
      id: `P-${String(i + 1).padStart(2, '0')}`,
      cls,
      confidence: Math.round((0.7 + rnd() * 0.27) * 100) / 100,
      box: [x, y, w, h],
      areaPct: Math.round(((w * h) / (width * height)) * 1000) / 10,
    });
  }
  return patches;
}
