"use client";

import { useState } from "react";
import { usePdfs } from "@/hooks/use-pdf";
import { PdfGrid } from "@/components/pdf/pdf-grid";
import { PdfEmptyState } from "@/components/pdf/pdf-empty-state";
import { PdfLoadingState } from "@/components/pdf/pdf-loading-state";
import { PdfListHeader } from "@/components/pdf/pdf-list-header";

export default function PdfPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = usePdfs();

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
