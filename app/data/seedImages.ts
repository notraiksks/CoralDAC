import { CLASS_ORDER, CoralClass, Patch, ReefImage } from '../lib/types';
import { STATIONS } from './reefStations';
import { hashString, mulberry32 } from '../lib/imageArt';

export const IMG_W = 4000;
export const IMG_H = 3000;

const CAMERAS = ['GoPro HERO11 Black', 'Olympus TG-6', 'Sony RX100 VII'];

function samplePatches(rnd: () => number, profile: Record<CoralClass, number>, prefix: string): Patch[] {
  // per-image variation around the station's typical cover mix
  const weights = CLASS_ORDER.map((k) => profile[k] * (0.5 + rnd() * 1.0));
  const total = weights.reduce((a, b) => a + b, 0);
  const n = 5 + Math.floor(rnd() * 5);
  const patches: Patch[] = [];
  for (let i = 0; i < n; i++) {
    let r = rnd() * total;
    let cls: CoralClass = 'lc';
    for (let k = 0; k < CLASS_ORDER.length; k++) {
      r -= weights[k];
      if (r <= 0) {
        cls = CLASS_ORDER[k];
        break;
      }
    }
    const w = Math.round(500 + rnd() * 650);
    const h = Math.round(450 + rnd() * 520);
    const x = Math.round(rnd() * (IMG_W - w));
    const y = Math.round(rnd() * (IMG_H - h));
    patches.push({
      id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
      cls,
      confidence: Math.round((0.72 + rnd() * 0.26) * 100) / 100,
      box: [x, y, w, h],
      areaPct: Math.round(((w * h) / (IMG_W * IMG_H)) * 1000) / 10,
    });
  }
  return patches;
}

export function buildSeedImages(): ReefImage[] {
  const out: ReefImage[] = [];
  STATIONS.forEach((st, si) => {
    const count = 32 + ((si * 5) % 13);
    const perTransect = Math.ceil(count / 3);
    for (let i = 0; i < count; i++) {
      const rnd = mulberry32(hashString(st.id) + i * 977);
      const t = Math.floor(i / perTransect);
      const q = i + 1;
      const lat = st.lat + t * 0.0011 + (rnd() - 0.5) * 0.0004;
      const lng = st.lng + ((i % perTransect) - perTransect / 2) * 0.00005 + (rnd() - 0.5) * 0.0003;
      const day = 12 + si * 13 + t;
      const when = new Date(Date.UTC(2026, 0, day, 8 + (i % 6), (i * 7) % 60));
      const capturedAt = when.toISOString().slice(0, 16);
      const id = `${st.id}-T${t + 1}-Q${String(q).padStart(3, '0')}`;
      out.push({
        id,
        name: `IMG_${st.id.replace('-', '')}_T${t + 1}_Q${String(q).padStart(3, '0')}.jpg`,
        src: '',
        width: IMG_W,
        height: IMG_H,
        stationId: st.id,
        location: st.name,
        transect: `T${t + 1}`,
        quadrat: q,
        lat,
        lng,
        capturedAt,
        camera: CAMERAS[si % CAMERAS.length],
        patches: samplePatches(rnd, st.profile, 'P'),
        source: 'archive',
        status: i % 7 === 0 ? 'pending' : 'verified',
      });
    }
  });
  return out;
}
