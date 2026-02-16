"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { PdfUploadButton } from "@/components/pdf/pdf-upload-button";

interface PdfListHeaderProps {
  defaultValue?: string;
  onSearch?: (value: string) => void;
}

export function PdfListHeader({
  defaultValue = "",
  onSearch,
}: PdfListHeaderProps) {
  const [search, setSearch] = useState(defaultValue);

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
      <div className="relative w-full sm:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by file name..."
          className="pl-9 w-full"
        />
      </div>

      <PdfUploadButton />
    </div>
  );
}
