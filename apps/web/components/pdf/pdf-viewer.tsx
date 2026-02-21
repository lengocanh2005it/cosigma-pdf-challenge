"use client";

import { HighlightOverlay } from "@/components/highlight/highlight-overlay";
import { RelatedOverlay } from "@/components/related/related-overlay";
import { HighlightItem, HighlightRect, RelatedResult } from "@packages/types";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PageOverlay } from "./page-overlay";

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
  const [domActiveRects, setDomActiveRects] = useState<HighlightRect[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleLoad({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  }

  useEffect(() => {
    if (!containerRef.current) return;
    if (jumpToPage == null) return;
    if (activeMatch) return;

    const container = containerRef.current;

    const page = container.querySelector(
      `[data-page-number="${jumpToPage}"]`,
    ) as HTMLElement | null;

    if (!page) return;

    container.scrollTo({
      top: page.offsetTop,
      behavior: "smooth",
    });
  }, [jumpToPage, activeMatch]);

  useEffect(() => {
    if (!containerRef.current || !onPageChange) return;

    const container = containerRef.current;

    const handleScroll = () => {
      const pages = Array.from(
        container.querySelectorAll("[data-page-number]"),
      ) as HTMLElement[];

      let closest = 1;
      let minDistance = Infinity;

      pages.forEach((p) => {
        const rect = p.getBoundingClientRect();
        const distance = Math.abs(
          rect.top - container.getBoundingClientRect().top,
        );

        if (distance < minDistance) {
          minDistance = distance;
          closest = Number(p.dataset.pageNumber);
        }
      });

      onPageChange(closest);
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

      const element =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as HTMLElement);

      const pageEl = element?.closest(
        "[data-page-number]",
      ) as HTMLElement | null;

      if (!pageEl) return;

      const pageNumber = Number(pageEl.dataset.pageNumber);

      const wrapper = pageEl.firstElementChild as HTMLElement;
      if (!wrapper) return;

      const wrapperRect = wrapper.getBoundingClientRect();

      const rects = Array.from(range.getClientRects());

      const normalizedRects: HighlightRect[] = rects.map((r) => ({
        pageNumber,
        x: (r.left - wrapperRect.left) / wrapperRect.width,
        y: (r.top - wrapperRect.top) / wrapperRect.height,
        width: r.width / wrapperRect.width,
        height: r.height / wrapperRect.height,
      }));

      onSelectText(text, normalizedRects);
      selection.removeAllRanges();
    };

    container.addEventListener("mouseup", handleMouseUp);
    return () => container.removeEventListener("mouseup", handleMouseUp);
  }, [onSelectText]);

  useEffect(() => {
    if (!activeMatch || !containerRef.current) {
      setDomActiveRects([]);
      return;
    }

    const container = containerRef.current;

    const pageElement = container.querySelector(
      `[data-page-number="${activeMatch.pageNumber}"]`,
    ) as HTMLElement | null;

    if (!pageElement) return;

    const textLayer = pageElement.querySelector(
      ".react-pdf__Page__textContent",
    ) as HTMLElement | null;

    if (!textLayer) return;

    const textLayerRect = textLayer.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const targetY = activeMatch.anchorY * textLayerRect.height;

    const absoluteTop =
      textLayerRect.top - containerRect.top + container.scrollTop + targetY;

    container.scrollTo({
      top: absoluteTop - container.clientHeight / 2,
      behavior: "smooth",
    });

    let attempts = 0;
    const maxAttempts = 10;

    const tryFind = () => {
      const rects = findRectsFromTextLayer(
        textLayer,
        activeMatch.matchedText,
        activeMatch.pageNumber,
        activeMatch.anchorY,
      );

      if (rects.length > 0) {
        setDomActiveRects(rects);
        return;
      }

      if (attempts < maxAttempts) {
        attempts++;
        requestAnimationFrame(tryFind);
      }
    };

    requestAnimationFrame(tryFind);
  }, [activeMatch]);

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
            <div className="relative inline-block">
              <Page
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
              />

              <HighlightOverlay
                pageNumber={index + 1}
                highlights={highlights}
              />

              <RelatedOverlay pageNumber={index + 1} rects={domActiveRects} />

              <PageOverlay pageNumber={index + 1} pendingRects={pendingRects} />
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}

function findRectsFromTextLayer(
  textLayer: HTMLElement,
  matchedText: string,
  pageNumber: number,
  anchorY: number,
): HighlightRect[] {
  const walker = document.createTreeWalker(
    textLayer,
    NodeFilter.SHOW_TEXT,
    null,
  );

  const textNodes: Text[] = [];
  let fullText = "";

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    textNodes.push(node);
    fullText += node.textContent ?? "";
  }

  const normalizedFull = fullText.replace(/\s+/g, " ").toLowerCase();
  const normalizedMatch = matchedText.replace(/\s+/g, " ").toLowerCase();

  const matchIndexes: number[] = [];
  let searchIndex = 0;

  while (true) {
    const found = normalizedFull.indexOf(normalizedMatch, searchIndex);
    if (found === -1) break;
    matchIndexes.push(found);
    searchIndex = found + normalizedMatch.length;
  }

  if (!matchIndexes.length) return [];

  const wrapper = textLayer.parentElement as HTMLElement;
  const wrapperRect = wrapper.getBoundingClientRect();

  const candidates: {
    rects: HighlightRect[];
    distance: number;
  }[] = [];

  for (const startIndex of matchIndexes) {
    let currentIndex = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;

    const endIndex = startIndex + normalizedMatch.length;

    for (const node of textNodes) {
      const text = node.textContent ?? "";
      const nextIndex = currentIndex + text.length;

      if (!startNode && startIndex >= currentIndex && startIndex < nextIndex) {
        startNode = node;
        startOffset = startIndex - currentIndex;
      }

      if (!endNode && endIndex > currentIndex && endIndex <= nextIndex) {
        endNode = node;
        endOffset = endIndex - currentIndex;
      }

      currentIndex = nextIndex;
    }

    if (!startNode || !endNode) continue;

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const rects = Array.from(range.getClientRects()).map((r) => ({
      pageNumber,
      x: (r.left - wrapperRect.left) / wrapperRect.width,
      y: (r.top - wrapperRect.top) / wrapperRect.height,
      width: r.width / wrapperRect.width,
      height: r.height / wrapperRect.height,
    }));

    if (!rects.length) continue;

    const rectCenterY = rects[0].y + rects[0].height / 2;

    const distance = Math.abs(rectCenterY - anchorY);

    candidates.push({ rects, distance });
  }

  if (!candidates.length) return [];

  candidates.sort((a, b) => a.distance - b.distance);

  return candidates[0].rects;
}
