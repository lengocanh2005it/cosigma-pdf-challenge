export interface PdfChunkDocument {
  pdfId: string;
  chunkId: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  normalizedContent: string;
  anchorY: number;
  rectTop: number;
  rectLeft: number;
  rectWidth: number;
  rectHeight: number;
}

export enum PdfStatus {
  UPLOADED = "UPLOADED",
  PROCESSING = "PROCESSING",
  INDEXING = "INDEXING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  DELETING = "DELETING",
}

export interface Pdf {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: PdfStatus;
  progress: number;
  totalPages: number;
  totalChunks: number;
  indexedChunks: number;
  retryCount: number;
  processingStartedAt?: Date;
  indexedAt?: Date;
  errorMessage?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
