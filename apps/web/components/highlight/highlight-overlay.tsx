"use client";

import { HighlightItem } from "@packages/types";

interface Props {
  pageNumber: number;
  highlights: HighlightItem[];
}

export function HighlightOverlay({ pageNumber, highlights }: Props) {
  const highlightRects = highlights.flatMap((h) =>
    h.rects
      .filter((r) => r.pageNumber === pageNumber)
      .map((r) => ({ ...r, color: h.color })),
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {highlightRects.map((rect, index) => (
        <div
          key={`h-${index}`}
          className="absolute rounded-sm"
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.width * 100}%`,
            height: `${rect.height * 100}%`,
            backgroundColor: rect.color ?? "rgba(253,224,71,0.4)",
          }}
        />
      ))}
    </div>
  );
}
