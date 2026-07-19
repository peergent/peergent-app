"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export function KnowledgeAlert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-500/20 bg-red-500/10 text-red-200",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    info: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  };
  return (
    <div className={cn("rounded-[14px] border px-4 py-3 text-sm", styles[tone])} role="alert">
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600">
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="pg-focus-premium mt-1.5 w-full rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 disabled:opacity-50"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="pg-focus-premium mt-1.5 w-full rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 disabled:opacity-50"
    />
  );
}

export function SaveButton({
  onClick,
  saving,
  label = "Save changes",
}: {
  onClick: () => void;
  saving?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="pg-focus-premium inline-flex items-center gap-2 rounded-[12px] bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {saving ? "Saving…" : label}
    </button>
  );
}

export function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function ItemCard({
  title,
  children,
  onDelete,
  deleting,
}: {
  title: string;
  children: ReactNode;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-xs text-red-400/80 hover:text-red-300 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function commaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinList(values: string[]): string {
  return values.join(", ");
}
