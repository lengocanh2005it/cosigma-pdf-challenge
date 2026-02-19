"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPages: number;
  onGo: (page: number) => void;
}

export function GoToPageDialog({
  open,
  onOpenChange,
  totalPages,
  onGo,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = () => {
    const value = Number(inputRef.current?.value);

    if (!value || value < 1 || value > totalPages) return;

    onGo(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Go to page</DialogTitle>
          <DialogDescription>
            Enter a page number between 1 and {totalPages}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            ref={inputRef}
            type="number"
            min={1}
            max={totalPages}
            placeholder="Page number"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button onClick={handleSubmit} className="cursor-pointer">
              Go
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
