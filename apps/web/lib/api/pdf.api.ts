import axiosInstance from "@/lib/axios";

export const getPdfs = async () => {
  const response = await axiosInstance.get("/pdf");
  return response.data;
};

export const getPdf = async (id: string) => {
  const response = await axiosInstance.get(`/pdf/${id}`);
  return response.data;
};

export const deletePdf = async (id: string) => {
  const response = await axiosInstance.delete(`/pdf/${id}`);
  return response.data;
};

export const getPdfStatus = async (id: string) => {
  const response = await axiosInstance.delete(`/pdf/${id}/status`);
  return response.data;
};
