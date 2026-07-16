"use client";

import { cn } from "@/lib/ui/cn";

export type TabItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export default function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-[var(--pg-radius-lg)] border border-white/10 bg-white/[0.03] p-1",
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "rounded-[var(--pg-radius-md)] px-4 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--pg-duration-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
