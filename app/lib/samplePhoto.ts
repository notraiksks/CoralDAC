import { IMG_H, IMG_W } from '../data/seedImages';
import { CLASS_ORDER, CoralClass, Patch, ReefImage } from './types';
import { getImageSrc, mulberry32 } from './imageArt';

let counter = 0;

/** Builds a synthetic quadrat photo (no EXIF) so the whole flow can be tried without owning a file. */
export async function createSamplePhoto(): Promise<File> {
  counter += 1;
  const rnd = mulberry32(7000 + counter * 131);
  const patches: Patch[] = Array.from({ length: 6 + Math.floor(rnd() * 3) }, (_, i) => {
    const w = Math.round(500 + rnd() * 650);
    const h = Math.round(450 + rnd() * 520);
    const cls = CLASS_ORDER[Math.floor(rnd() * 4)] as CoralClass;
    return { id: `S-${i + 1}`, cls, confidence: 0.8, box: [Math.round(rnd() * (IMG_W - w)), Math.round(rnd() * (IMG_H - h)), w, h], areaPct: 1 };
  });
  const fake: ReefImage = {
    id: `sample-${counter}`, name: '', src: '', width: IMG_W, height: IMG_H, stationId: null, location: '', transect: '', quadrat: 1,
    lat: 0, lng: 0, capturedAt: '', camera: '', patches, source: 'archive', status: 'pending',
  };
  const img = new Image();
  img.src = getImageSrc(fake);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1200;
  canvas.getContext('2d')!.drawImage(img, 0, 0, 1600, 1200);
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/jpeg', 0.85));
  return new File([blob], `sample_quadrat_${counter}.jpg`, { type: 'image/jpeg' });
}
