"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PdfUploadButtonProps {
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PdfUploadButton({
  className,
  variant = "default",
  size = "default",
}: PdfUploadButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => router.push("/upload")}
      className={cn("gap-2", className)}
    >
      <Plus className="w-4 h-4" />
      {size !== "icon" && "Upload PDF"}
    </Button>
  );
}
