export type CoralClass = 'lc' | 'pb' | 'dc' | 'dca';
export const CLASS_ORDER: CoralClass[] = ['lc', 'pb', 'dc', 'dca'];

export const CLASS_META: Record<CoralClass, { label: string; short: string; color: string; rgb: [number, number, number] }> = {
  lc: { label: 'Living Coral', short: 'LC', color: '#3a9d3a', rgb: [58, 157, 58] },
  pb: { label: 'Partially Bleached', short: 'PB', color: '#f5c026', rgb: [245, 192, 38] },
  dc: { label: 'Dead Coral', short: 'DC', color: '#f26b2d', rgb: [242, 107, 45] },
  dca: { label: 'Dead Coral w/ Algae', short: 'DCA', color: '#e03a3a', rgb: [224, 58, 58] },
};

export type Layers = Record<CoralClass, boolean>;

/** One detected coral patch (YOLOv8 box + ResNet50 class). Box is [x, y, w, h] in image pixels. */
export interface Patch {
  id: string;
  cls: CoralClass;
  confidence: number;
  box: [number, number, number, number];
  areaPct: number;
}

export interface ReefStation {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  /** Typical cover mix (percent) used to generate the demo archive. */
  profile: Record<CoralClass, number>;
}

export interface ReefImage {
  id: string;
  name: string;
  /** Empty for generated archive images (see getImageSrc); object URL for uploads. */
  src: string;
  width: number;
  height: number;
  stationId: string | null;
  location: string;
  transect: string;
  quadrat: number;
  lat: number;
  lng: number;
  /** Naive local time, "YYYY-MM-DDTHH:mm" */
  capturedAt: string;
  camera: string;
  patches: Patch[];
  source: 'archive' | 'upload';
  status: 'verified' | 'pending';
  simulated?: boolean;
}
