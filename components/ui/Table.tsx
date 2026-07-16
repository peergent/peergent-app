import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type TableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  className?: string;
};

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available",
  className,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn("px-4 py-3 font-medium first:pl-0", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="border-b border-white/5 transition-colors duration-[var(--pg-duration-fast)] hover:bg-white/[0.02]"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-4 text-slate-300 first:pl-0",
                    column.className
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
