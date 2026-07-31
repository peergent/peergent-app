"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";

/**
 * §5 Cut table — the workhorse of Performance. Sortable, numerals aligned,
 * row click drills in.
 *
 * Wide content scrolls inside its own container so the page body never
 * scrolls sideways.
 */

export type PgTableColumn<T> = {
  id: string;
  header: string;
  align?: "left" | "right";
  /** Numerals get tabular alignment so columns never reflow. */
  numeric?: boolean;
  sortable?: boolean;
  /** Sort key. Required when `sortable`. */
  sortValue?: (row: T) => number | string;
  render: (row: T) => ReactNode;
  width?: string;
};

export type PgTableProps<T> = {
  columns: readonly PgTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Drill-in destination. Makes the whole row interactive. */
  rowHref?: (row: T) => string | null;
  caption?: string;
  className?: string;
  testId?: string;
};

export default function PgTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  caption,
  className,
  testId,
}: PgTableProps<T>) {
  const router = useRouter();
  const [sort, setSort] = useState<{ id: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.id === sort.id);
    if (!column?.sortValue) return rows;

    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sort.dir === "asc" ? result : -result;
    });
  }, [rows, sort, columns]);

  function toggleSort(column: PgTableColumn<T>) {
    if (!column.sortable || !column.sortValue) return;
    setSort((current) =>
      current?.id === column.id
        ? { id: column.id, dir: current.dir === "asc" ? "desc" : "asc" }
        : { id: column.id, dir: "desc" }
    );
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[var(--pg-radius-md)]",
        "border border-[var(--pg-office-line)]",
        className
      )}
      data-testid={testId}
    >
      <table className="w-full border-collapse bg-[var(--pg-office-panel)]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.id === column.id;
              return (
                <th
                  key={column.id}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={
                    active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn(
                    "border-b border-[var(--pg-office-line)] px-[var(--pg-space-4)]",
                    "py-[var(--pg-space-3)] whitespace-nowrap",
                    column.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className={cn(
                        "pg-label pg-focus-premium inline-flex items-center gap-1",
                        "transition-colors duration-[var(--pg-duration-state)]",
                        "hover:text-[var(--pg-color-text-secondary)]",
                        active && "text-[var(--pg-color-text-secondary)]"
                      )}
                    >
                      {column.header}
                      {active ? (
                        sort.dir === "asc" ? (
                          <ChevronUp size={11} aria-hidden />
                        ) : (
                          <ChevronDown size={11} aria-hidden />
                        )
                      ) : null}
                    </button>
                  ) : (
                    <span className="pg-label">{column.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const href = rowHref?.(row) ?? null;
            return (
              <tr
                key={rowKey(row)}
                onClick={href ? () => router.push(href) : undefined}
                className={cn(
                  "border-b border-[var(--pg-office-line)] last:border-b-0",
                  href &&
                    "cursor-pointer transition-colors duration-[var(--pg-duration-state)] hover:bg-[var(--pg-color-accent-subtle)]"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-[var(--pg-space-4)] py-[var(--pg-space-3)] align-top",
                      "text-[var(--pg-type-body-sm)] text-[var(--pg-color-text-secondary)]",
                      column.align === "right" ? "text-right" : "text-left",
                      column.numeric && "tabular-nums"
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
