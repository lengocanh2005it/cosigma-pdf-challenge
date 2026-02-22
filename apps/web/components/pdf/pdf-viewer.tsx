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

    const scrollToAnchor = () => {
      const textLayerRect = textLayer.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const targetY = activeMatch.anchorY * textLayerRect.height;

      const absoluteTop =
        textLayerRect.top - containerRect.top + container.scrollTop + targetY;

      container.scrollTo({
        top: absoluteTop - container.clientHeight / 2,
        behavior: "smooth",
      });
    };

    scrollToAnchor();

    const inflateRect = (rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => {
      const verticalPadding = 0.006;
      const horizontalPadding = 0.004;

      const newTop = Math.max(0, rect.y - verticalPadding);
      const newLeft = Math.max(0, rect.x - horizontalPadding);

      const newHeight = Math.min(1 - newTop, rect.height + verticalPadding * 2);

      const newWidth = Math.min(
        1 - newLeft,
        rect.width + horizontalPadding * 2,
      );

      return {
        pageNumber: activeMatch.pageNumber,
        x: newLeft,
        y: newTop,
        width: newWidth,
        height: newHeight,
      };
    };

    const mergeRects = (
      rects: {
        pageNumber: number;
        x: number;
        y: number;
        width: number;
        height: number;
      }[],
    ) => {
      if (rects.length <= 1) return rects;

      const sorted = [...rects].sort((a, b) =>
        Math.abs(a.y - b.y) < 0.001 ? a.x - b.x : a.y - b.y,
      );

      const merged: typeof rects = [];

      const lineThreshold = 0.008;
      const gapThreshold = 0.01;

      let current = { ...sorted[0] };

      for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];

        const sameLine = Math.abs(next.y - current.y) < lineThreshold;

        const gap = next.x - (current.x + current.width);

        if (sameLine && gap < gapThreshold) {
          const right = Math.max(
            current.x + current.width,
            next.x + next.width,
          );

          current.width = right - current.x;
          current.height = Math.max(current.height, next.height);
        } else {
          merged.push(current);
          current = { ...next };
        }
      }

      merged.push(current);
      return merged;
    };

    const handleNoEmCase = () => {
      const inflated = inflateRect({
        x: activeMatch.rectLeft,
        y: activeMatch.rectTop,
        width: activeMatch.rectWidth,
        height: activeMatch.rectHeight,
      });

      setDomActiveRects([inflated]);
    };

    const handleEmCase = () => {
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
          const mergedRects = mergeRects(rects);

          const inflatedRects = mergedRects.map((r) =>
            inflateRect({
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
            }),
          );

          setDomActiveRects(inflatedRects);
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          requestAnimationFrame(tryFind);
        }
      };

      requestAnimationFrame(tryFind);
    };

    if (!activeMatch.snippet.includes("<em>")) {
      handleNoEmCase();
    } else {
      handleEmCase();
    }
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

  if (!fullText) return [];

  const normalizedFull = fullText.replace(/\s+/g, " ").toLowerCase();
  const normalizedMatch = matchedText.replace(/\s+/g, " ").toLowerCase();

  const wrapper = textLayer.parentElement as HTMLElement;
  if (!wrapper) return [];

  const wrapperRect = wrapper.getBoundingClientRect();

  const candidates: {
    rects: HighlightRect[];
    distance: number;
  }[] = [];

  function buildRangeRects(
    startIndex: number,
    endIndex: number,
  ): HighlightRect[] {
    let currentIndex = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;

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

    if (!startNode || !endNode) return [];

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    return Array.from(range.getClientRects()).map((r) => ({
      pageNumber,
      x: (r.left - wrapperRect.left) / wrapperRect.width,
      y: (r.top - wrapperRect.top) / wrapperRect.height,
      width: r.width / wrapperRect.width,
      height: r.height / wrapperRect.height,
    }));
  }

  let searchIndex = 0;

  while (true) {
    const found = normalizedFull.indexOf(normalizedMatch, searchIndex);
    if (found === -1) break;

    const rects = buildRangeRects(found, found + normalizedMatch.length);

    if (rects.length) {
      const centerY = rects[0].y + rects[0].height / 2;
      const distance = Math.abs(centerY - anchorY);
      candidates.push({ rects, distance });
    }

    searchIndex = found + normalizedMatch.length;
  }

  if (candidates.length) {
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0].rects;
  }

  const tokens = normalizedMatch
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  tokens.forEach((token) => {
    let tokenSearch = 0;

    while (true) {
      const found = normalizedFull.indexOf(token, tokenSearch);
      if (found === -1) break;

      const rects = buildRangeRects(found, found + token.length);

      if (rects.length) {
        const centerY = rects[0].y + rects[0].height / 2;
        const distance = Math.abs(centerY - anchorY);
        candidates.push({ rects, distance });
      }

      tokenSearch = found + token.length;
    }
  });

  if (candidates.length) {
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0].rects;
  }

  const spans = Array.from(textLayer.querySelectorAll("span"));
  if (!spans.length) return [];

  const spanRects = spans.map((span) => {
    const r = span.getBoundingClientRect();
    const y = (r.top - wrapperRect.top) / wrapperRect.height;

    return {
      span,
      rect: r,
      distance: Math.abs(y - anchorY),
    };
  });

  spanRects.sort((a, b) => a.distance - b.distance);

  const closest = spanRects[0];
  if (!closest) return [];

  const lineY = (closest.rect.top - wrapperRect.top) / wrapperRect.height;

  const sameLineSpans = spans.filter((span) => {
    const r = span.getBoundingClientRect();
    const y = (r.top - wrapperRect.top) / wrapperRect.height;
    return Math.abs(y - lineY) < 0.01;
  });

  if (!sameLineSpans.length) return [];

  const rects = sameLineSpans.map((span) => span.getBoundingClientRect());

  const minLeft = Math.min(...rects.map((r) => r.left));
  const maxRight = Math.max(...rects.map((r) => r.right));
  const minTop = Math.min(...rects.map((r) => r.top));
  const maxBottom = Math.max(...rects.map((r) => r.bottom));

  return [
    {
      pageNumber,
      x: (minLeft - wrapperRect.left) / wrapperRect.width,
      y: (minTop - wrapperRect.top) / wrapperRect.height,
      width: (maxRight - minLeft) / wrapperRect.width,
      height: (maxBottom - minTop) / wrapperRect.height,
    },
  ];
}
