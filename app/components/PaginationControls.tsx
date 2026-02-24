"use client";

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  focusedIndex: number;
  onFocusIndex: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled: boolean;
  nextDisabled: boolean;
  previousRef: RefObject<HTMLButtonElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
}

export function PaginationControls({
  page,
  totalPages,
  focusedIndex,
  onFocusIndex,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  previousRef,
  nextRef,
}: PaginationControlsProps) {
  return (
    <div className="grid grid-cols-[132px_1fr_132px] items-center gap-3" aria-label="Movie pages">
      <Button
        ref={previousRef}
        type="button"
        variant="outline"
        className={cn("w-full", focusedIndex === 0 && "ring-ring ring-2")}
        onFocus={() => onFocusIndex(0)}
        onClick={onPrevious}
        disabled={previousDisabled}
        tabIndex={-1}
      >
        Previous
      </Button>

      <span className="text-muted-foreground text-center font-mono text-sm">
        Page {page} / {totalPages}
      </span>

      <Button
        ref={nextRef}
        type="button"
        variant="outline"
        className={cn("w-full", focusedIndex === 1 && "ring-ring ring-2")}
        onFocus={() => onFocusIndex(1)}
        onClick={onNext}
        disabled={nextDisabled}
        tabIndex={-1}
      >
        Next
      </Button>
    </div>
  );
}
