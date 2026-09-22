export interface QuadratRecord {
  id: string;
  quadratNumber: number;
  coverLC: number;
  coverPB: number;
  coverDC: number;
  coverDCA: number;
  dominantClass: string;
  confidence: number;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'FLAGGED';
  timestamp: string;
}

export interface PastTransect {
  id: string;
  code: string;
  date: string;
  waterTemp: string;
  visibility: string;
  bleachedCover: string;
  primaryClass: string;
  quadratsCount: number;
}

export interface StationData {
  id: string;
  name: string;
  depth: number;
  transect: string;
  coordinates: string;
  x: number; // SVG coordinate
  y: number; // SVG coordinate
  health: {
    lc: number;
    pb: number;
    dc: number;
    dca: number;
  };
  quadratsCount: number;
  meanTemp: number;
  parLight: number;
  phLevel: number;
  profilePoint: { x: number; y: number; label: string };
  quadrats: QuadratRecord[];
  pastTransects: PastTransect[];
}

export interface LayerFilters {
  lc: boolean;
  pb: boolean;
  dc: boolean;
  dca: boolean;
}

export interface MapFilters {
  layers: LayerFilters;
  heatmapIntensity: number;
  detectionConfidence: number;
}

export interface CursorTelemetry {
  lat: string;
  lng: string;
  depth: string;
}

export * from './submissions';
export * from './curation';
