import { CoralClass, ReefImage } from './types';

/**
 * Procedural stand-in photos for the demo archive, so the gallery never shows
 * broken images. Uploaded photos use their real object URL instead.
 */
const PALETTE: Record<CoralClass, string[]> = {
  lc: ['#6a8f3a', '#8a7a2e', '#a67c3c', '#5f8a4a', '#b08a3e'],
  pb: ['#efe9cf', '#f7f3e3', '#ddd3ab', '#e8dfc0'],
  dc: ['#8b8b88', '#6f6f6c', '#a0a09a', '#7b7a74'],
  dca: ['#5c6b2a', '#44521f', '#6e7a3a', '#4f5d27'],
};

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, string>();

export function getImageSrc(img: ReefImage): string {
  if (img.src) return img.src;
  const hit = cache.get(img.id);
  if (hit) return hit;
  const uri = buildArt(img);
  cache.set(img.id, uri);
  return uri;
}

function buildArt(img: ReefImage): string {
  const W = img.width;
  const H = img.height;
  const rnd = mulberry32(hashString(img.id));
  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)];
  const parts: string[] = [];

  // water / sand backdrop
  parts.push(
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6f86"/><stop offset=".55" stop-color="#3b8798"/><stop offset="1" stop-color="#b7a77a"/></linearGradient></defs>`,
    `<rect width="${W}" height="${H}" fill="url(#g)"/>`
  );
  for (let i = 0; i < 46; i++) {
    const r = 60 + rnd() * 220;
    parts.push(
      `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${r.toFixed(0)}" fill="${pick(['#ffffff', '#12394a', '#c9b98a'])}" opacity="${(0.04 + rnd() * 0.07).toFixed(2)}"/>`
    );
  }

  // one coral colony per detected patch, coloured by its class
  for (const p of img.patches) {
    const [x, y, w, h] = p.box;
    const cx = x + w / 2;
    const cy = y + h / 2;
    parts.push(
      `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${(w * 0.48).toFixed(0)}" ry="${(h * 0.46).toFixed(0)}" fill="${pick(PALETTE[p.cls])}"/>`
    );
    const n = 14;
    for (let i = 0; i < n; i++) {
      const rx = x + rnd() * w;
      const ry = y + rnd() * h;
      parts.push(
        `<circle cx="${rx.toFixed(0)}" cy="${ry.toFixed(0)}" r="${(w * (0.05 + rnd() * 0.09)).toFixed(0)}" fill="${pick(PALETTE[p.cls])}" opacity="${(0.55 + rnd() * 0.4).toFixed(2)}"/>`
      );
    }
  }

  // blue PVC quadrat frame, like the field photos in the proposal
  parts.push(
    `<rect x="0" y="${(H * 0.93).toFixed(0)}" width="${W}" height="${(H * 0.022).toFixed(0)}" fill="#1f6fe0" opacity=".9"/>`,
    `<rect x="${(W * 0.012).toFixed(0)}" y="0" width="${(W * 0.016).toFixed(0)}" height="${H}" fill="#1f6fe0" opacity=".85"/>`
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${parts.join('')}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Light-weight round thumbnail art for map markers (fewer shapes than the full photo art). */
const miniCache = new Map<string, string>();
export function getThumbSrc(img: ReefImage): string {
  if (img.src) return img.src;
  const hit = miniCache.get(img.id);
  if (hit) return hit;
  const rnd = mulberry32(hashString(img.id + 'm'));
  const parts: string[] = [
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6f86"/><stop offset="1" stop-color="#b7a77a"/></linearGradient></defs>',
    '<rect width="100" height="100" fill="url(#g)"/>',
  ];
  for (const p of img.patches.slice(0, 7)) {
    const [x, y, w, h] = p.box;
    const cx = ((x + w / 2) / img.width) * 100;
    const cy = ((y + h / 2) / img.height) * 100;
    const r = Math.max(9, (w / img.width) * 62);
    const pal = PALETTE[p.cls];
    parts.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${pal[Math.floor(rnd() * pal.length)]}"/>`);
  }
  parts.push('<rect x="0" y="92" width="100" height="3" fill="#1f6fe0" opacity=".9"/>');
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${parts.join('')}</svg>`)}`;
  miniCache.set(img.id, uri);
  return uri;
}
