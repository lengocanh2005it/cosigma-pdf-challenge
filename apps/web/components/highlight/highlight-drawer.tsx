"use client";

import { HighlightItem } from "@packages/types";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Props {
  highlights: HighlightItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJump: (item: HighlightItem) => void;
  onDelete: (id: string) => void;
}

export function HighlightDrawer({
  highlights,
  open,
  onOpenChange,
  onJump,
  onDelete,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerTrigger asChild>
        <Button className="cursor-pointer">
          Highlights ({highlights.length})
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-full max-w-md ml-auto">
        <DrawerHeader className="pb-4">
          <DrawerTitle className="text-lg font-semibold">
            Highlights
          </DrawerTitle>

          <p className="text-sm text-muted-foreground">
            Saved text selections from this document for quick reference.
          </p>
        </DrawerHeader>

        <Separator className="mb-4" />

        <ScrollArea className="px-5 pb-8 flex-1 h-150">
          {highlights.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-10">
              No highlights yet
            </p>
          )}

          <div className="space-y-3 mb-2">
            {highlights.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border bg-background/70 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition"
              >
                <div
                  className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl"
                  style={{ backgroundColor: item.color }}
                />

                <div className="pl-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Page {item.pageNumber}
                  </p>

                  <p className="text-sm leading-relaxed line-clamp-3">
                    {item.text}
                  </p>

                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => onDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
