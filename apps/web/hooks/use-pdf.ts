import { deletePdf, getPdf, getPdfs } from "@/lib/api/pdf.api";
import { handleAxiosError } from "@/lib/utils";
import { Pdf, PdfStatus } from "@packages/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const usePdfs = () => {
  return useQuery<Pdf[]>({
    queryKey: ["pdfs"],
    queryFn: getPdfs,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const usePdf = (pdfId: string | undefined) => {
  return useQuery<Pdf>({
    queryKey: ["pdf", pdfId],
    queryFn: () => getPdf(pdfId!),
    enabled: !!pdfId,
    refetchOnWindowFocus: false,
    refetchInterval: (data) => {
      console.log(data);
      const status = data?.status;

      if (
        status === PdfStatus.PROCESSING ||
        status === PdfStatus.UPLOADED ||
        status === PdfStatus.INDEXING
      ) {
        return 2000;
      }

      return false;
    },
  });
};

export const useDeletePdf = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePdf,
    onSuccess: async (data) => {
      if (data && data?.success && data?.fileName?.trim()) {
        await queryClient.invalidateQueries({
          queryKey: ["pdfs"],
        });
        toast.success(`PDF "${data.fileName}" deleted successfully!`, {
          position: "bottom-right",
        });
      }
    },
    onError: (err) => handleAxiosError(err),
  });
};
