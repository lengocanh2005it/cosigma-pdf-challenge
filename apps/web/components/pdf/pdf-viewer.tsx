"use client";

import { HighlightManager } from "@/components/highlight/highlight-manager";
import { RelatedResult, HighlightRect, HighlightItem } from "@packages/types";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface Props {
  fileUrl: string;
  scale?: number;
  jumpToPage?: number | null;
  activeMatch?: RelatedResult | null;
  onSelectText?: (text: string, rects: HighlightRect[]) => void;
  onPageChange?: (page: number) => void;
  onLoadSuccess?: (totalPages: number) => void;
  clearSelectionSignal?: number;
  pendingRects?: HighlightRect[];
  highlights?: HighlightItem[];
}

export function PdfViewer({
  fileUrl,
  scale = 1,
  jumpToPage,
  activeMatch,
  onSelectText,
  onPageChange,
  onLoadSuccess,
  pendingRects,
  highlights = [],
}: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleLoad({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  }

  useEffect(() => {
    if (jumpToPage == null || !containerRef.current) return;

    const container = containerRef.current;

    const page = container.querySelector(
      `[data-page-number="${jumpToPage}"]`,
    ) as HTMLElement | null;

    if (!page) return;

    const containerRect = container.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();

    const offset = pageRect.top - containerRect.top + container.scrollTop;

    container.scrollTo({
      top: offset,
      behavior: "smooth",
    });
  }, [jumpToPage]);

  useEffect(() => {
    if (!containerRef.current || !onPageChange) return;

    const container = containerRef.current;

    const handleScroll = () => {
      const pages = Array.from(
        container.querySelectorAll("[data-page-number]"),
      ) as HTMLElement[];

      if (!pages.length) return;

      const containerTop = container.getBoundingClientRect().top;

      let closestPage = 1;
      let minDistance = Infinity;

      pages.forEach((page) => {
        const pageNumber = Number(page.dataset.pageNumber);
        if (!pageNumber) return;

        const rect = page.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop);

        if (distance < minDistance) {
          minDistance = distance;
          closestPage = pageNumber;
        }
      });

      onPageChange(Math.max(closestPage, 1));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onPageChange]);

  useEffect(() => {
    if (!containerRef.current || !onSelectText) return;

    const container = containerRef.current;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const text = selection.toString().trim();
      if (!text || text.length <= 3) return;

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      const rects = Array.from(range.getClientRects());
      const containerRect = container.getBoundingClientRect();

      const newHighlights: HighlightRect[] = rects.map((rect) => ({
        x: rect.left - containerRect.left + container.scrollLeft,
        y: rect.top - containerRect.top + container.scrollTop,
        width: rect.width,
        height: rect.height,
      }));

      onSelectText(text, newHighlights);
      selection.removeAllRanges();
    };

    container.addEventListener("mouseup", handleMouseUp);
    return () => container.removeEventListener("mouseup", handleMouseUp);
  }, [onSelectText]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto h-full bg-muted/30 relative"
    >
      <Document file={fileUrl} onLoadSuccess={handleLoad}>
        {Array.from(new Array(numPages), (_, index) => (
          <div
            key={index}
            data-page-number={index + 1}
            className="flex justify-center mb-6 relative"
          >
            <Page
              pageNumber={index + 1}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
            />
          </div>
        ))}
      </Document>

      {highlights.map((item) =>
        item.rects.map((rect, index) => (
          <div
            key={`${item.id}-${index}`}
            className="absolute pointer-events-none rounded-sm"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              backgroundColor: item.color,
            }}
          />
        )),
      )}

      {pendingRects?.map((rect, index) => (
        <div
          key={`preview-${index}`}
          className="absolute bg-yellow-300/40 pointer-events-none rounded-sm"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        />
      ))}

      <HighlightManager
        container={containerRef.current}
        activeMatch={activeMatch ?? null}
      />
    </div>
  );
}
