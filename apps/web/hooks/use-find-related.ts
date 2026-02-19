"use client";

import { findPdfsRelated } from "@/lib/api/pdf.api";
import { useMutation } from "@tanstack/react-query";

export function useFindRelated() {
  return useMutation({
    mutationFn: findPdfsRelated,
  });
}
