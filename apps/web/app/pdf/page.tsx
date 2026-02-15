"use client";
import { usePdfs } from "@/hooks/use-pdf";

const PdfPage = () => {
  const { data, isLoading } = usePdfs();
  return <div>Home Page</div>;
};

export default PdfPage;
