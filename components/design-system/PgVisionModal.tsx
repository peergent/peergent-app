"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/ui/cn";
import { useTheme } from "@/components/theme/ThemeProvider";

export type PgVisionModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** preview (480px) or workspace (660px) */
  size?: "preview" | "workspace";
  className?: string;
  testId?: string;
};

export default function PgVisionModal({
  open,
  onClose,
  children,
  size = "preview",
  className,
  testId,
}: PgVisionModalProps) {
  const { resolved } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pg-vision pg-v13-modal-backdrop"
      data-pg-theme={resolved}
      data-testid={testId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "pg-v13-modal",
          size === "workspace" && "pg-v13-modal--workspace",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
