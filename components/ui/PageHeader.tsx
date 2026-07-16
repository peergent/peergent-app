import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: "default" | "compact";
  className?: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  size = "default",
  className,
}: PageHeaderProps) {
  const compact = size === "compact";

  return (
    <header
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        compact ? "mb-6" : "mb-8",
        className
      )}
    >
      <div className={cn(compact ? "max-w-2xl" : "max-w-3xl")}>
        {eyebrow && (
          <p
            className={cn(
              "font-medium text-slate-500",
              compact ? "text-xs uppercase tracking-[0.08em]" : "text-sm text-violet-400"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "font-semibold tracking-tight text-white",
            compact
              ? "text-2xl md:text-3xl"
              : "text-3xl md:text-4xl",
            eyebrow && (compact ? "mt-1" : "mt-1")
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "text-slate-500",
              compact ? "mt-1 text-sm leading-6" : "mt-2 text-base leading-7 text-slate-400"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </header>
  );
}
