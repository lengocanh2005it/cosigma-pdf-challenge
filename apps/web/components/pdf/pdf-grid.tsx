import { Pdf } from "@packages/types";
import { PdfCard } from "./pdf-card";

interface PdfGridProps {
  pdfs: Pdf[];
}

export function PdfGrid({ pdfs }: PdfGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {pdfs.map((pdf) => (
        <PdfCard key={pdf.id} pdf={pdf} />
      ))}
    </div>
  );
}
