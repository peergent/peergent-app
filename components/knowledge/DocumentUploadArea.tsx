"use client";

import { useState } from "react";
import { FileUp, Upload } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type DocumentUploadAreaProps = {
  onBrowseClick?: () => void;
};

export default function DocumentUploadArea({
  onBrowseClick,
}: DocumentUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "rounded-2xl border border-dashed p-8 text-center transition",
        isDragging
          ? "border-[var(--pg-accent)] bg-[var(--pg-accent-muted)]"
          : "border-[var(--pg-input-border)] bg-[var(--pg-surface-secondary)] hover:border-[var(--pg-border-strong)] hover:bg-[var(--pg-surface-hover)]"
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pg-accent-muted)]">
        <Upload size={24} className="text-[var(--pg-accent)]" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-[var(--pg-text)]">
        Drag & drop documents here
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--pg-text-muted)]">
        Upload PDFs, Word files, and text documents to train your AI workforce.
        File uploads will be enabled soon.
      </p>

      <button
        type="button"
        onClick={onBrowseClick}
        className="pg-btn-secondary pg-focus-premium mt-6"
      >
        <FileUp size={16} />
        Browse files
      </button>
    </div>
  );
}
