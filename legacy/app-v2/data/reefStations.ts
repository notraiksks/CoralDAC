import { ReefStation } from '../lib/types';

/**
 * Demo survey stations across the Philippines. Coral Garden D uses the
 * coordinates shown in the proposal mock-up (13°31'09.7"N 120°57'20.0"E);
 * the others are approximate, placeholder reef sites — replace with your real stations.
 */
export const STATIONS: ReefStation[] = [
  { id: 'CG-D', name: 'Coral Garden D', area: 'Puerto Galera, Oriental Mindoro', lat: 13.5194, lng: 120.9556, profile: { lc: 34, pb: 30, dc: 18, dca: 18 } },
  { id: 'CG-A', name: 'Coral Garden A', area: 'Puerto Galera, Oriental Mindoro', lat: 13.5251, lng: 120.9578, profile: { lc: 52, pb: 24, dc: 12, dca: 12 } },
  { id: 'CG-B', name: 'Coral Garden B', area: 'Puerto Galera, Oriental Mindoro', lat: 13.5226, lng: 120.9502, profile: { lc: 44, pb: 26, dc: 16, dca: 14 } },
  { id: 'ANL-1', name: 'Anilao Twin Rocks', area: 'Mabini, Batangas', lat: 13.759, lng: 120.902, profile: { lc: 58, pb: 20, dc: 12, dca: 10 } },
  { id: 'APO-1', name: 'Apo Reef East', area: 'Sablayan, Occidental Mindoro', lat: 12.66, lng: 120.47, profile: { lc: 70, pb: 14, dc: 9, dca: 7 } },
  { id: 'MLB-1', name: 'Moalboal Panagsama', area: 'Moalboal, Cebu', lat: 9.942, lng: 123.3905, profile: { lc: 40, pb: 34, dc: 14, dca: 12 } },
  { id: 'TUB-1', name: 'Tubbataha North Atoll', area: 'Cagayancillo, Palawan', lat: 8.87, lng: 119.89, profile: { lc: 78, pb: 10, dc: 6, dca: 6 } },
  { id: 'BOL-1', name: 'Bolinao Reef Flat', area: 'Bolinao, Pangasinan', lat: 16.4, lng: 119.86, profile: { lc: 24, pb: 22, dc: 24, dca: 30 } },
];

export const STATION_BY_ID = new Map(STATIONS.map((s) => [s.id, s]));
