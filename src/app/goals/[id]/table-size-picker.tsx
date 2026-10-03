"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Table } from "lucide-react";

const MAX_ROWS = 8;
const MAX_COLS = 8;

type TableSizePickerProps = {
  onSelect: (rows: number, cols: number) => void;
  active?: boolean;
};

export function TableSizePicker({ onSelect, active }: TableSizePickerProps) {
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);
  const [open, setOpen] = useState(false);

  const handleSelect = (rows: number, cols: number) => {
    onSelect(rows, cols);
    setOpen(false);
    setHoveredRow(0);
    setHoveredCol(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-bold transition",
          active
            ? "bg-accent text-ink"
            : "text-muted hover:bg-surface hover:text-text",
        )}
      >
        <Table size={14} />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto border-line bg-surface p-3"
      >
        <p className="mb-2 h-4 text-center text-xs font-bold text-accent">
          {hoveredRow > 0 && hoveredCol > 0
            ? `${hoveredRow} × ${hoveredCol}`
            : ""}
        </p>

        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 20px)` }}
          onMouseLeave={() => {
            setHoveredRow(0);
            setHoveredCol(0);
          }}
        >
          {Array.from({ length: MAX_ROWS }).map((_, rowIdx) =>
            Array.from({ length: MAX_COLS }).map((_, colIdx) => {
              const row = rowIdx + 1;
              const col = colIdx + 1;
              const isHighlighted = row <= hoveredRow && col <= hoveredCol;

              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onMouseEnter={() => {
                    setHoveredRow(row);
                    setHoveredCol(col);
                  }}
                  onClick={() => handleSelect(row, col)}
                  className={cn(
                    "size-5 rounded-sm border transition-colors",
                    isHighlighted
                      ? "border-accent bg-accent/40"
                      : "border-line bg-raised",
                  )}
                  aria-label={`${row} در ${col}`}
                />
              );
            }),
          )}
        </div>

        <p className="mt-2 text-center text-[10px] text-muted">
          {hoveredRow > 0 ? "برای درج کلیک کنید" : "ماوس را روی خانه‌ها ببرید"}
        </p>
      </PopoverContent>
    </Popover>
  );
}
