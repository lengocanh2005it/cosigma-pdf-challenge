"use client";

import { GoToPageDialog } from "@/components/pdf/go-to-page-dialog";
import { useFindRelated } from "@/hooks/use-find-related";
import { usePdf } from "@/hooks/use-pdf";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { HighlightDrawer } from "@/components/highlight/highlight-drawer";
import { RelatedPanel } from "@/components/highlight/related-panel";
import { PdfToolbar } from "@/components/pdf/pdf-toolbar";
import { Button } from "@/components/ui/button";
import { getNextAvailableColor } from "@/lib/utils";
import { HighlightItem, HighlightRect, RelatedResult } from "@packages/types";

const PdfViewer = dynamic(
  () => import("@/components/pdf/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    ),
  },
);

const INITIAL_PANEL_POSITION = { x: 0, y: 0 };

export default function PdfDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: pdf, isLoading, isError } = usePdf(id);
  const findRelatedMutation = useFindRelated();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [goToPageOpen, setGoToPageOpen] = useState(false);

  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [pendingRects, setPendingRects] = useState<HighlightRect[]>([]);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [relatedResults, setRelatedResults] = useState<RelatedResult[]>([]);
  const [activeMatch, setActiveMatch] = useState<RelatedResult | null>(null);
  const [jumpPage, setJumpPage] = useState<number | null>(null);

  const [showPanel, setShowPanel] = useState(false);
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0);

  const [panelPosition, setPanelPosition] = useState(INITIAL_PANEL_POSITION);

  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setJumpPage(clamped);
  };

  const handleClosePanel = () => {
    setSelectedText(null);
    setRelatedResults([]);
    setActiveMatch(null);
    setShowPanel(false);
    setJumpPage(null);
    setClearSelectionSignal((prev) => prev + 1);
    setPanelPosition(INITIAL_PANEL_POSITION);
    setPendingRects([]);
    setShowActionButtons(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC
      if (e.key === "Escape") {
        handleClosePanel();
        return;
      }

      // Ctrl + G
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setGoToPageOpen(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") {
        e.preventDefault();
        goToPage(currentPage + 1);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") {
        e.preventDefault();
        goToPage(currentPage - 1);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setScale((s) => Math.min(s + 0.2, 2));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setScale((s) => Math.max(s - 0.2, 0.6));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages, currentPage]);

  const handleGoToPage = (page: number) => {
    setJumpPage(page);

    setTimeout(() => setJumpPage(null), 0);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );

  if (isError || !pdf)
    return (
      <div className="flex items-center justify-center h-screen">
        PDF not found
      </div>
    );

  const fileUrl = `http://localhost:3001/files/${pdf.fileName}`;

  const handleSelectText = (text: string, rects: HighlightRect[]) => {
    if (!text.trim()) return;

    setSelectedText(text);
    setPendingRects(rects);
    setShowActionButtons(true);
    setShowPanel(false);
  };

  const handleAddHighlight = () => {
    if (!selectedText || pendingRects.length === 0) return;

    const usedColors = highlights.map((h) => h.color);

    const newHighlight: HighlightItem = {
      id: crypto.randomUUID(),
      text: selectedText,
      pageNumber: currentPage,
      rects: pendingRects,
      color: getNextAvailableColor(usedColors),
    };

    setHighlights((prev) => [...prev, newHighlight]);

    setSelectedText(null);
    setPendingRects([]);
    setShowActionButtons(false);
    setClearSelectionSignal((prev) => prev + 1);
  };

  const handleJumpHighlight = (item: HighlightItem) => {
    setJumpPage(item.pageNumber);
    setDrawerOpen(false);
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const handleFindRelated = () => {
    if (!selectedText) return;

    setShowPanel(true);

    findRelatedMutation.mutate(
      { pdfId: id, query: selectedText },
      {
        onSuccess: (data) => setRelatedResults(data),
      },
    );
  };

  const handleJump = (result: RelatedResult) => {
    setActiveMatch(result);
    setJumpPage(result.pageNumber);
  };

  return (
    <div className="relative h-150 overflow-hidden">
      <div className="h-full flex flex-col">
        <PdfToolbar
          fileName={pdf.originalName}
          currentPage={currentPage}
          totalPages={totalPages}
          scale={scale}
          onZoomIn={() => setScale((s) => Math.min(s + 0.2, 2))}
          onZoomOut={() => setScale((s) => Math.max(s - 0.2, 0.6))}
          onDownload={() => window.open(fileUrl, "_blank")}
          onBack={() => router.push("/pdf")}
        />

        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          <PdfViewer
            fileUrl={fileUrl}
            scale={scale}
            onPageChange={setCurrentPage}
            onLoadSuccess={setTotalPages}
            jumpToPage={jumpPage}
            activeMatch={activeMatch}
            onSelectText={handleSelectText}
            clearSelectionSignal={clearSelectionSignal}
            pendingRects={pendingRects}
            highlights={highlights}
          />

          {showActionButtons && selectedText && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3">
              <Button
                onClick={handleAddHighlight}
                className="rounded-xl shadow-lg hover:scale-105 transition cursor-pointer"
              >
                Highlight
              </Button>

              <Button
                onClick={handleFindRelated}
                className="rounded-xl shadow-lg hover:scale-105 transition cursor-pointer"
              >
                {findRelatedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Find related"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed right-7 top-27 z-50">
        <HighlightDrawer
          highlights={highlights}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onJump={handleJumpHighlight}
          onDelete={handleDeleteHighlight}
        />
      </div>

      {showPanel && (
        <DndContext
          sensors={sensors}
          onDragEnd={(event: DragEndEvent) => {
            setPanelPosition((prev) => ({
              x: prev.x + event.delta.x,
              y: prev.y + event.delta.y,
            }));
          }}
        >
          <DraggablePanel position={panelPosition}>
            {(dragHandleProps) => (
              <RelatedPanel
                dragHandleProps={dragHandleProps}
                results={relatedResults}
                loading={findRelatedMutation.isPending}
                error={
                  findRelatedMutation.isError
                    ? (findRelatedMutation.error as Error)?.message
                    : null
                }
                onJump={handleJump}
                selectedText={selectedText}
                onClearSelectedText={handleClosePanel}
              />
            )}
          </DraggablePanel>
        </DndContext>
      )}

      <GoToPageDialog
        open={goToPageOpen}
        onOpenChange={setGoToPageOpen}
        totalPages={totalPages}
        onGo={handleGoToPage}
      />
    </div>
  );
}

function DraggablePanel({
  children,
  position,
}: {
  children: (dragHandleProps: any) => React.ReactNode;
  position: { x: number; y: number };
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "related-panel",
  });

  const style = {
    transform: `translate3d(
      ${position.x + (transform?.x ?? 0)}px,
      ${position.y + (transform?.y ?? 0)}px,
      0
    )`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="fixed right-10 top-1/2 -translate-y-1/2 h-[70%] z-50"
    >
      {children({ ...listeners, ...attributes })}
    </div>
  );
}
