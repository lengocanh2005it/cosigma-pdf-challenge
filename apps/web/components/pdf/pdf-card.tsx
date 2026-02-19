"use client";

import { useDeletePdf } from "@/hooks/use-pdf";
import { cn, shortFileSuffix } from "@/lib/utils";
import { Pdf, PdfStatus } from "@packages/types";
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PdfCardProps {
  pdf: Pdf;
  onDelete?: (id: string) => void;
}

export function PdfCard({ pdf, onDelete }: PdfCardProps) {
  const router = useRouter();
  const { mutate, isPending } = useDeletePdf();

  const {
    id,
    originalName,
    status,
    createdAt,
    progress,
    totalPages,
    errorMessage,
    mimeType,
    fileSize,
    indexedChunks,
    totalChunks,
    retryCount,
    fileName,
  } = pdf;

  const isClickable = status === PdfStatus.COMPLETED;
  const isDeleting = status === PdfStatus.DELETING;

  const handleView = () => {
    if (!isClickable) return;
    router.push(`/pdf/${id}`);
  };

  const handleDelete = () => {
    if (isDeleting || isPending) return;
    mutate(id);
    onDelete?.(id);
  };

  const renderStatusBadge = () => {
    switch (status) {
      case PdfStatus.UPLOADED:
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">
            Uploaded
          </Badge>
        );

      case PdfStatus.PROCESSING:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing {progress}%
          </Badge>
        );

      case PdfStatus.INDEXING:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Indexing {progress}%
          </Badge>
        );

      case PdfStatus.COMPLETED:
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            {totalPages} pages
          </Badge>
        );

      case PdfStatus.FAILED:
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        );

      case PdfStatus.DELETING:
        return (
          <Badge className="bg-muted text-muted-foreground">
            <Trash2 className="w-3 h-3 animate-pulse" />
            Deleting
          </Badge>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "relative group p-4 rounded-2xl border bg-card transition-all duration-300",
        "border-border shadow-sm hover:shadow-md hover:-translate-y-1",
      )}
    >
      <div className="relative h-44 rounded-xl overflow-hidden mb-4 border bg-linear-to-br from-muted to-muted/40">
        <div className="absolute inset-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-4 space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-4/5" />
          <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-5/6" />
          <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-2/3" />
          <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-4/6" />
        </div>

        {status !== PdfStatus.COMPLETED && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === PdfStatus.COMPLETED && (
          <div className="absolute bottom-3 right-3 opacity-10 group-hover:opacity-20 transition">
            <FileText className="w-10 h-10 text-primary" />
          </div>
        )}
      </div>

      <h3 className="font-semibold text-sm truncate flex items-center gap-1">
        <span
          onClick={
            isClickable && pdf.status === PdfStatus.COMPLETED
              ? handleView
              : undefined
          }
          className={cn(
            "truncate transition",
            isClickable
              ? "cursor-pointer hover:underline hover:text-primary"
              : "cursor-not-allowed opacity-70",
          )}
        >
          {originalName}
        </span>
        <span className="text-xs text-muted-foreground">
          • {shortFileSuffix(fileName)}
        </span>
      </h3>

      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
        <span>{mimeType?.split("/")[1]?.toUpperCase()}</span>
        <span>•</span>
        <span>{formatBytes(fileSize)}</span>
      </div>

      <div className="mt-3">{renderStatusBadge()}</div>

      {status === PdfStatus.INDEXING && (
        <p className="text-[11px] text-muted-foreground mt-1">
          {indexedChunks} / {totalChunks} chunks indexed
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        {new Date(createdAt).toLocaleDateString()}
      </p>

      {status === PdfStatus.FAILED && errorMessage && (
        <p className="text-xs text-red-500 mt-2 line-clamp-1">
          {errorMessage}
          {retryCount > 0 && ` • Retry ${retryCount}`}
        </p>
      )}

      {!isDeleting && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {isClickable && pdf.status === PdfStatus.COMPLETED && (
            <button
              onClick={handleView}
              className="p-2 rounded-full bg-background/80 backdrop-blur-md 
              border border-border shadow-sm hover:bg-primary hover:text-white transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-2 rounded-full bg-red-500/10 text-red-600 
            border border-red-500/30 shadow-sm
            hover:bg-red-500 hover:text-white transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full",
        className,
      )}
    >
      {children}
    </span>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
