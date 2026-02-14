export interface PdfChunkDocument {
  pdfId: string;
  chunkId: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  embedding?: number[];
}
