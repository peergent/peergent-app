import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type PremiumDividerProps = HTMLAttributes<HTMLDivElement> & {
  /** Optional centered label — e.g. section break in forms. */
  label?: string;
  /** Extra inset from edges. */
  inset?: boolean;
  /** Vertical divider for split layouts. */
  orientation?: "horizontal" | "vertical";
};

export default function PremiumDivider({
  label,
  inset = false,
  orientation = "horizontal",
  className,
  ...props
}: PremiumDividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "w-px self-stretch bg-gradient-to-b from-transparent via-white/[0.08] to-transparent",
          className
        )}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={cn(
          "flex items-center gap-4",
          inset && "px-4",
          className
        )}
        {...props}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-white/[0.06]" />
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-600">
          {label}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/[0.08] to-white/[0.06]" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      className={cn(
        "h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent",
        inset && "mx-4",
        className
      )}
      {...props}
    />
  );
}
