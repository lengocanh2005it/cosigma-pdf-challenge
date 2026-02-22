"use client";

import { RelatedResult } from "@packages/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Props {
  results: RelatedResult[];
  loading: boolean;
  error: string | null;
  onJump: (item: RelatedResult) => void;
  selectedText?: string | null;
  onClearSelectedText?: () => void;
  dragHandleProps?: any;
}

export function RelatedPanel({
  results,
  loading,
  error,
  onJump,
  selectedText,
  onClearSelectedText,
  dragHandleProps,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const resultCount = results.length;

  const renderSnippet = (snippet: string) => {
    const hasHighlight = snippet.includes("<em>");

    if (hasHighlight) {
      return snippet;
    }

    const cleanText = snippet.replace(/<[^>]+>/g, "");

    const parts = cleanText.split(/(\s+)/);

    return parts
      .map((part) => {
        if (part.trim() === "") return part;

        return `<span class="bg-yellow-200 text-black px-1 font-bold rounded">${part}</span>`;
      })
      .join("");
  };

  return (
    <Card
      className={`
        w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border bg-background
        transition-all duration-300 ease-in-out
        ${collapsed ? "h-20" : "h-full"}
      `}
    >
      <CardHeader className="select-none">
        <div
          {...dragHandleProps}
          className="flex items-center justify-between cursor-grab active:cursor-grabbing"
        >
          <CardTitle className="text-base font-semibold">
            Related Results
          </CardTitle>

          <div className="flex items-center gap-2">
            {selectedText && onClearSelectedText && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSelectedText();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {!loading && resultCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {resultCount} result{resultCount > 1 ? "s" : ""}
              </Badge>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((prev) => !prev);
              }}
            >
              {collapsed ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <>
          <Separator className="m-0" />

          <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-full px-4 py-3">
              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive text-center py-6">
                  {error}
                </div>
              )}

              {!loading && !error && !selectedText && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Select text inside the PDF to find related content.
                </div>
              )}

              {!loading && !error && selectedText && resultCount === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No related results found.
                </div>
              )}

              {!loading && !error && resultCount > 0 && (
                <div className="space-y-4 mb-2">
                  {results.map((item) => (
                    <Card
                      key={item.chunkId}
                      className="p-4 rounded-xl border shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          Page {item.pageNumber}
                        </span>

                        <Badge variant="secondary" className="text-xs">
                          {item.confidence.toFixed(2)}
                        </Badge>
                      </div>

                      <div
                        className="
                          text-sm leading-relaxed mb-3 text-foreground
                          [&_em]:bg-yellow-200
                          [&_em]:text-black
                          [&_em]:not-italic
                          [&_em]:font-semibold
                          [&_em]:px-1
                          [&_em]:rounded
                        "
                        dangerouslySetInnerHTML={{
                          __html: renderSnippet(item.snippet),
                        }}
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onJump(item)}
                        className="w-full rounded-lg cursor-pointer"
                      >
                        Jump to
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </>
      )}
    </Card>
  );
}
