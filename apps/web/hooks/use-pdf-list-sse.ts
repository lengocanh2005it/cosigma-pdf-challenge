"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pdf, PdfStatus } from "@packages/types";

export function usePdfListSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_BASE_URL}/pdf/events/stream`,
    );

    es.onmessage = (event) => {
      const data: Pdf = JSON.parse(event.data);

      queryClient.setQueryData<Pdf[]>(["pdfs"], (old) => {
        if (!old) return old;

        if (data.status === PdfStatus.DELETING) {
          return old.filter((p) => p.id !== data.id);
        }

        const exists = old.find((p) => p.id === data.id);

        if (!exists) {
          return [data, ...old];
        }

        return old.map((p) => (p.id === data.id ? { ...p, ...data } : p));
      });
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [queryClient]);
}
