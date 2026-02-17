"use client";

import { Button } from "@/components/ui/button";
import { UploadProgressModal } from "@/components/upload-progress-modal";
import { useUploadPdf } from "@/hooks/use-upload-pdf";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useRef } from "react";

interface PdfUploadButtonProps {
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PdfUploadButton({
  className,
  variant = "default",
  size = "default",
}: PdfUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadMutation = useUploadPdf();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate(file);

    e.target.value = "";
  };

  return (
    <>
      <UploadProgressModal
        open={uploadMutation.isPending}
        progress={uploadMutation.progress}
        fileName={uploadMutation.fileName}
      />

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleFileChange}
      />

      <Button
        variant={variant}
        size={size}
        onClick={() => inputRef.current?.click()}
        className={cn("gap-2 cursor-pointer", className)}
        disabled={uploadMutation.isPending}
      >
        <Plus className="w-4 h-4" />

        {size !== "icon" &&
          (uploadMutation.isPending ? "Uploading..." : "Upload PDF")}
      </Button>
    </>
  );
}
