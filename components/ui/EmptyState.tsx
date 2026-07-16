import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actions?: ReactNode;
  tone?: "default" | "inspire";
  className?: string;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actions,
  tone = "default",
  className,
}: EmptyStateProps) {
  const inspired = tone === "inspire";

  return (
    <Card
      elevation="inset"
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        inspired && "border-dashed border-white/[0.08]",
        className
      )}
      padding="lg"
    >
      {icon && (
        <div
          className={cn(
            "mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--pg-radius-xl)]",
            inspired
              ? "bg-[var(--pg-accent-soft)] text-violet-300"
              : "border border-white/10 bg-white/[0.03] text-slate-400"
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
          {description}
        </p>
      )}
      {actions ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      ) : action ? (
        <Button className="mt-8" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </Card>
  );
}
