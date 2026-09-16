export type SubmissionStatus = 'approved' | 'pending' | 'rejected';

export interface BenthicClassCounts {
  lc: number;
  pb: number;
  dc: number;
  dca: number;
}

export interface SubmissionRecord {
  id: string;
  file: string;
  fileSize: string;
  format: string;
  thumbnailUrl: string;
  altText: string;
  uploadedDate: string;
  uploadedTimeUtc: string;
  stationId: string;
  stationName: string;
  transectSector: string;
  coordinates: string;
  depth: string;
  cameraSettings?: string;
  diver?: string;
  status: SubmissionStatus;
  statusDetail: string;
  provisionalCounts: BenthicClassCounts;
  ratios: {
    lc: number;
    pb: number;
    dc: number;
    dca: number;
  };
  confidence: number;
  rejectReason?: {
    recordCode: string;
    reviewer: string;
    note: string;
    codeDetail: string;
  };
}
