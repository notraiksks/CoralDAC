import { CLASS_ORDER, CoralClass, Layers, Patch, ReefImage } from './types';

/** Share of patch area per class, in percent (sums to ~100). */
export function coverOf(patches: Patch[]): Record<CoralClass, number> {
  const total = patches.reduce((s, p) => s + p.areaPct, 0);
  const out: Record<CoralClass, number> = { lc: 0, pb: 0, dc: 0, dca: 0 };
  if (total <= 0) return out;
  for (const p of patches) out[p.cls] += (p.areaPct / total) * 100;
  return out;
}

export function dominantOf(img: ReefImage): CoralClass {
  const c = coverOf(img.patches);
  return CLASS_ORDER.reduce((best, k) => (c[k] > c[best] ? k : best), 'lc' as CoralClass);
}

/** Fraction (0..1) of an image's classified area that belongs to enabled layers. */
export function layerWeight(img: ReefImage, layers: Layers): number {
  const c = coverOf(img.patches);
  return CLASS_ORDER.reduce((s, k) => s + (layers[k] ? c[k] : 0), 0) / 100;
}

export function bleachedShare(img: ReefImage): number {
  const c = coverOf(img.patches);
  return c.pb + c.dc + c.dca;
}
