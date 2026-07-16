"use client";

import { useState } from "react";
import { FileUp, Upload } from "lucide-react";

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
      className={`rounded-2xl border border-dashed p-8 text-center transition ${
        isDragging
          ? "border-violet-500/50 bg-violet-500/10"
          : "border-white/15 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/[0.03]"
      }`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
        <Upload size={24} className="text-violet-400" />
      </div>

      <h3 className="mt-5 text-base font-semibold">
        Drag & drop documents here
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Upload PDFs, Word files, and text documents to train your AI workforce.
        File uploads will be enabled soon.
      </p>

      <button
        type="button"
        onClick={onBrowseClick}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
      >
        <FileUp size={16} />
        Browse files
      </button>
    </div>
  );
}
