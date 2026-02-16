"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ZoomIn, ZoomOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PdfToolbarProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload?: () => void;
  onBack?: () => void;
}

export function PdfToolbar({
  fileName,
  currentPage,
  totalPages,
  scale,
  onZoomIn,
  onZoomOut,
  onDownload,
  onBack,
}: PdfToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3 bg-background sticky top-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        <div className="flex flex-col">
          <span className="text-sm font-medium">{fileName}</span>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <span className="text-xs w-12 text-center">
          {(scale * 100).toFixed(0)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {onDownload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDownload}
                className="cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
