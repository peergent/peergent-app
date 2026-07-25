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
    error: "pg-alert-error",
    success: "pg-alert-success",
    info: "pg-alert-info",
  };
  return (
    <div className={cn("rounded-[14px] border px-4 py-3 text-sm", styles[tone])} role="alert">
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="pg-field-label">{children}</label>;
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
      className="pg-input pg-focus-premium"
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
      className="pg-textarea pg-focus-premium"
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
    <button type="button" onClick={onClick} disabled={saving} className="pg-btn-save pg-focus-premium">
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
    <section className="pg-section-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--pg-text)]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-[var(--pg-helper-text)]">{description}</p>
          )}
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
    <div className="pg-item-panel">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-[var(--pg-text)]">{title}</h3>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-xs text-[var(--pg-danger)] hover:opacity-80 disabled:opacity-50"
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
