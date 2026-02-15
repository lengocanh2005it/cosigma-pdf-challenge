import { getPdfs } from "@/lib/api/pdf.api";
import { useQuery } from "@tanstack/react-query";
import { Pdf } from "@packages/types";

export const usePdfs = () => {
  return useQuery<Pdf[]>({
    queryKey: ["pdfs"],
    queryFn: getPdfs,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};
