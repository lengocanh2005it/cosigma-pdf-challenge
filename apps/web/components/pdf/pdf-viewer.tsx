"use client";

import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfViewerProps {
  fileUrl: string;
  scale?: number;
  onPageChange?: (page: number) => void;
  onLoadSuccess?: (totalPages: number) => void;
  jumpToPage?: number | null;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  fileUrl,
  scale = 1,
  onPageChange,
  onLoadSuccess,
  jumpToPage,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleDocumentLoad({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  }

  // Scroll to page
  useEffect(() => {
    if (!jumpToPage || !containerRef.current) return;

    const pageElement = containerRef.current.querySelector(
      `[data-page-number="${jumpToPage}"]`,
    );

    pageElement?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [jumpToPage]);

  // Detect current page
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onPageChange) return;

    const handleScroll = () => {
      const pages = Array.from(
        container.querySelectorAll("[data-page-number]"),
      ) as HTMLElement[];

      const containerTop = container.getBoundingClientRect().top;

      let closestPage = 1;
      let minDistance = Infinity;

      pages.forEach((page) => {
        const rect = page.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop);

        if (distance < minDistance) {
          minDistance = distance;
          closestPage = Number(page.dataset.pageNumber);
        }
      });

      onPageChange(closestPage);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onPageChange]);

  return (
    <div ref={containerRef} className="overflow-auto h-full relative">
      <Document file={fileUrl} onLoadSuccess={handleDocumentLoad}>
        {Array.from(new Array(numPages), (_, index) => (
          <div
            key={`page_${index + 1}`}
            data-page-number={index + 1}
            className="mb-6 flex justify-center"
          >
            <Page
              pageNumber={index + 1}
              scale={scale}
              renderAnnotationLayer
              renderTextLayer
            />
          </div>
        ))}
      </Document>
    </div>
  );
};
