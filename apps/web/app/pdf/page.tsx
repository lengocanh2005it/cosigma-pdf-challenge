"use client";

import { PdfEmptyState } from "@/components/pdf/pdf-empty-state";
import { PdfGrid } from "@/components/pdf/pdf-grid";
import { PdfListHeader } from "@/components/pdf/pdf-list-header";
import { PdfLoadingState } from "@/components/pdf/pdf-loading-state";
import { usePdfs } from "@/hooks/use-pdf";
import { usePdfListSSE } from "@/hooks/use-pdf-list-sse";
import { useState } from "react";

export default function PdfPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = usePdfs();

  usePdfListSSE();

  const isEmpty = !isLoading && (!data || data.length === 0);

  return (
    <div>
      {isLoading && <PdfLoadingState />}

      {!isLoading && isEmpty && !search && <PdfEmptyState />}

      {!isLoading && (!isEmpty || search) && (
        <>
          <PdfListHeader onSearch={setSearch} />

          {isEmpty ? (
            <div className="py-12 text-center text-muted-foreground">
              No results found for "{search}"
            </div>
          ) : (
            <PdfGrid pdfs={data} />
          )}
        </>
      )}
    </div>
  );
}
