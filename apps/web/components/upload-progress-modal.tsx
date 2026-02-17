"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface UploadProgressModalProps {
  open: boolean;
  progress: number;
  fileName?: string | null;
}

export function UploadProgressModal({
  open,
  progress,
  fileName,
}: UploadProgressModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-lg font-semibold">
          Uploading PDF...
        </DialogTitle>

        <div className="space-y-4 mt-2">
          {fileName && (
            <p className="text-sm text-muted-foreground truncate">{fileName}</p>
          )}

          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-sm text-right font-medium">{progress}%</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
