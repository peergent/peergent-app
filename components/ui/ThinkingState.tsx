import PresenceIndicator, {
  type PresenceMode,
} from "@/components/ui/PresenceIndicator";
import { cn } from "@/lib/ui/cn";

export type ThinkingStateProps = {
  mode: PresenceMode;
  label: string;
  /** Secondary line — e.g. source being processed. */
  detail?: string;
  /** Compact inline vs stacked layout. */
  layout?: "inline" | "stacked";
  className?: string;
};

export default function ThinkingState({
  mode,
  label,
  detail,
  layout = "inline",
  className,
}: ThinkingStateProps) {
  const stacked = layout === "stacked";

  return (
    <div
      className={cn(
        stacked ? "flex flex-col gap-1.5" : "inline-flex flex-wrap items-center gap-2",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn("flex items-center gap-2", stacked && "gap-2.5")}>
        <PresenceIndicator mode={mode} />
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      {detail && (
        <span
          className={cn(
            "text-xs text-slate-600",
            !stacked && "before:mr-2 before:text-slate-700 before:content-['·']"
          )}
        >
          {detail}
        </span>
      )}
    </div>
  );
}
