export interface RelatedResult {
  chunkId: string;
  pdfId: string;
  pageNumber: number;
  snippet: string;
  score: number;
  confidence: number;
  matchedText: string;
  anchorY: number;
  rectTop: number;
  rectLeft: number;
  rectWidth: number;
  rectHeight: number;
}

export interface MatchRect {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
