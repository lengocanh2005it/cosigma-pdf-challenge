import { deletePdf, getPdf, getPdfs } from "@/lib/api/pdf.api";
import { handleAxiosError } from "@/lib/utils";
import { Pdf } from "@packages/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const usePdfs = () => {
  return useQuery<Pdf[]>({
    queryKey: ["pdfs"],
    queryFn: getPdfs,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const usePdf = (pdfId: string) => {
  return useQuery<Pdf>({
    queryKey: [`pdfs/${pdfId}`],
    queryFn: () => getPdf(pdfId),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const useDeletePdf = () => {
  return useMutation({
    mutationFn: deletePdf,
    onSuccess: () => {},
    onError: (err) => handleAxiosError(err),
  });
};
