import { cn } from "@/lib/ui/cn";

export type ProgressProps = {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export default function Progress({
  value,
  label,
  showValue = true,
  size = "md",
  className,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.08em] text-slate-500">
          {label && <span>{label}</span>}
          {showValue && <span className="normal-case tracking-normal">{clamped}%</span>}
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-full bg-white/[0.06]",
          size === "sm" ? "h-1" : "h-1.5"
        )}
      >
        <div
          className="h-full rounded-full bg-violet-500 transition-[width] duration-[var(--pg-duration-slow)] ease-[var(--pg-ease-standard)]"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
