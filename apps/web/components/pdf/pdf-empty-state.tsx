"use client";

import { FileText } from "lucide-react";
import { PdfUploadButton } from "@/components/pdf/pdf-upload-button";

export function PdfEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <FileText className="w-10 h-10 text-muted-foreground" />
      </div>

      <h2 className="text-xl font-semibold mb-2">No PDFs found</h2>

      <p className="text-muted-foreground mb-6 max-w-md">
        There are no PDF files available yet. Upload your first document to get
        started.
      </p>

      <PdfUploadButton />
    </div>
  );
}
