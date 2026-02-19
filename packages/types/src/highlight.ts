export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HighlightItem {
  id: string;
  text: string;
  pageNumber: number;
  rects: HighlightRect[];
  color: string;
}
