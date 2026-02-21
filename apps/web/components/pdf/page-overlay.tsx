"use client";

import { HighlightRect } from "@packages/types";

interface Props {
  pageNumber: number;
  pendingRects?: HighlightRect[];
}

export function PageOverlay({ pageNumber, pendingRects }: Props) {
  const pending =
    pendingRects?.filter((r) => r.pageNumber === pageNumber) ?? [];

  if (!pending.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {pending.map((rect, index) => (
        <div
          key={index}
          className="absolute rounded-sm bg-yellow-300/40"
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.width * 100}%`,
            height: `${rect.height * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
