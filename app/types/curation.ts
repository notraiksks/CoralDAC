export interface BoundingBox {
  id: string;
  label: string; // '[LC]', '[PB]', '[DC]', '[DCA]'
  classKey: 'lc' | 'pb' | 'dc' | 'dca';
  confidence: number;
  top: string;
  left: string;
  width: string;
  height: string;
  bgColor: string;
  textColor: string;
}

export interface CurationRecord {
  id: string;
  submissionNumber: string;
  uploadedDate: string;
  timestamp: string;
  stationId: string;
  stationName: string;
  stationSector: string;
  nominalDepth: string;

  // Quadrat Imagery & Annotations
  quadratImg: string;
  altText: string;
  boundingBoxes: BoundingBox[];
  hudFov: string;
  hudScale: string;
  hudStation: string;

  // 4-Class Breakdown (Health Status: LC, PB, DC, DCA)
  nodesCount: number;
  proportions: {
    lc: number;
    pb: number;
    dc: number;
    dca: number;
    substrate: number;
  };
  counts: {
    lc: number;
    pb: number;
    dc: number;
    dca: number;
    substrate: number;
  };

  // Inference Metrics
  detectorModel: string;
  classifierModel: string;
  iou: number;
  meanConfidence: number;
  batchId: string;

  // Survey Station Location Reference (Surface GPS)
  stationCoordinates: string;
  mapImage: string;

  // Review Status & Notes
  status: 'pending' | 'approved' | 'rejected';
  marginalia: string;
  rejectReason?: string;
}

