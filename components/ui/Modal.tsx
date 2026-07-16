"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import Button from "@/components/ui/Button";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[pg-fade-in_var(--pg-duration-base)_var(--pg-ease-standard)]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pg-modal-title"
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[var(--pg-radius-xl)] border border-white/10 bg-[#0b1120] shadow-[var(--pg-shadow-lg)] animate-[pg-scale-in_var(--pg-duration-base)_var(--pg-ease-emphasis)]",
          sizeStyles[size]
        )}
      >
        <div className="border-b border-white/10 px-6 py-5">
          <h2 id="pg-modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer !== undefined ? (
          <div className="border-t border-white/10 px-6 py-4">{footer}</div>
        ) : (
          <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
