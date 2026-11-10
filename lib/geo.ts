import type { Station as ReefStation } from './types';

/** Rough bounding box of the Philippines (incl. Kalayaan & Batanes). */
export const PH_BOUNDS: [[number, number], [number, number]] = [[4.4, 116.0], [21.4, 127.0]];

export function inPhilippines(lat: number, lng: number): boolean {
  return lat >= PH_BOUNDS[0][0] && lat <= PH_BOUNDS[1][0] && lng >= PH_BOUNDS[0][1] && lng <= PH_BOUNDS[1][1];
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function nearestStation(stations: ReefStation[], lat: number, lng: number) {
  let best: { station: ReefStation; km: number } | null = null;
  for (const s of stations) {
    const km = haversineKm(lat, lng, s.lat, s.lng);
    if (!best || km < best.km) best = { station: s, km };
  }
  return best;
}

function dms(value: number, pos: string, neg: string): string {
  const hemi = value >= 0 ? pos : neg;
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(1);
  return `${d}°${String(m).padStart(2, '0')}'${s.padStart(4, '0')}"${hemi}`;
}

export const formatLat = (lat: number) => dms(lat, 'N', 'S');
export const formatLng = (lng: number) => dms(lng, 'E', 'W');
export const formatCoords = (lat: number | null, lng: number | null) =>
  lat == null || lng == null ? "No location" : `${formatLat(lat)} ${formatLng(lng)}`;

/** "2026-03-04T10:41" -> "Mar 4, 2026 · 10:41" (no timezone maths on purpose). */
export function formatCaptured(capturedAt: string): string {
  const [d, t = ''] = capturedAt.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!y || !m || !day) return capturedAt;
  return `${months[m - 1]} ${day}, ${y}${t ? ' · ' + t : ''}`;
}
