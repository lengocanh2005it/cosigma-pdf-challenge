"use client";

import { usePdf } from "@/hooks/use-pdf";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useState } from "react";

const PdfViewer = dynamic(
  () => import("@/components/pdf/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    ),
  },
);

export default function PdfDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: pdf, isLoading, isError } = usePdf(id);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (isError || !pdf) {
    return (
      <div className="flex items-center justify-center h-screen">
        PDF not found
      </div>
    );
  }

  const fileUrl = `http://localhost:3001/files/${pdf.fileName}`;

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.6))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            -
          </button>

          <span className="text-sm font-medium">
            Zoom: {(scale * 100).toFixed(0)}%
          </span>

          <button
            onClick={() => setScale((prev) => Math.min(prev + 0.2, 2))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            +
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {pdf.originalName} — Page {currentPage} / {totalPages}
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <PdfViewer
          fileUrl={fileUrl}
          scale={scale}
          onPageChange={setCurrentPage}
          onLoadSuccess={setTotalPages}
        />
      </div>
    </div>
  );
}
