"use client";

import { usePdf } from "@/hooks/use-pdf";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PdfToolbar } from "@/components/pdf/pdf-toolbar";

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
  const router = useRouter();
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

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  const handleDownload = () => {
    window.open(fileUrl, "_blank");
  };

  const handleBack = () => {
    router.push("/pdf");
  };

  return (
    <div className="flex flex-col h-screen">
      <PdfToolbar
        fileName={pdf.originalName}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onDownload={handleDownload}
        onBack={handleBack}
      />

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
