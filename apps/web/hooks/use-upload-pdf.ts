"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";

interface UploadedPdfResponse {
  id: string;
  fileName: string;
  status: string;
  progress: number;
}

export function useUploadPdf() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const mutation = useMutation<UploadedPdfResponse, Error, File>({
    mutationFn: async (file) => {
      setFileName(file.name);

      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axiosInstance.post("/pdf", formData, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });

      return data;
    },

    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["pdfs"],
      });

      toast.success(`PDF "${data.fileName}" uploaded successfully 🎉`, {
        position: "bottom-right",
      });

      setProgress(0);
      setFileName(null);
    },

    onError: () => {
      toast.error("Failed to upload PDF ❌");

      setProgress(0);
      setFileName(null);
    },
  });

  return {
    ...mutation,
    progress,
    fileName,
  };
}
