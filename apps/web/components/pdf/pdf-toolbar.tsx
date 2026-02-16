"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface PdfToolbarProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload?: () => void;
}

export function PdfToolbar({
  fileName,
  currentPage,
  totalPages,
  scale,
  onZoomIn,
  onZoomOut,
  onDownload,
}: PdfToolbarProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between border-b px-4 py-3 bg-background sticky top-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pdf")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex flex-col">
          <span className="text-sm font-medium line-clamp-1 max-w-62.5">
            {fileName}
          </span>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Zoom out */}
        <Button variant="ghost" size="icon" onClick={onZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>

        <span className="text-xs w-12 text-center">
          {(scale * 100).toFixed(0)}%
        </span>

        {/* Zoom in */}
        <Button variant="ghost" size="icon" onClick={onZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Download */}
        {onDownload && (
          <Button variant="ghost" size="icon" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
