"use client";

import { HighlightRect } from "@packages/types";

interface Props {
  pageNumber: number;
  rects: HighlightRect[];
}

export function RelatedOverlay({ pageNumber, rects }: Props) {
  const pageRects = rects.filter((r) => r.pageNumber === pageNumber);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {pageRects.map((rect, index) => (
        <div
          key={`r-${index}`}
          className="absolute rounded-sm ring-2 ring-red-500"
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.width * 100}%`,
            height: `${rect.height * 100}%`,
            backgroundColor: "transparent",
          }}
        />
      ))}
    </div>
  );
}
