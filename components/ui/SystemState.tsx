import PresenceIndicator, {
  type PresenceMode,
} from "@/components/ui/PresenceIndicator";
import { cn } from "@/lib/ui/cn";

export type SystemStateProps = {
  mode: PresenceMode;
  label: string;
  context?: string;
  className?: string;
};

export default function SystemState({
  mode,
  label,
  context,
  className,
}: SystemStateProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-2 text-xs text-slate-500",
        className
      )}
    >
      <PresenceIndicator mode={mode} />
      <span className="font-medium text-slate-400">{label}</span>
      {context && (
        <>
          <span className="text-slate-600" aria-hidden>
            ·
          </span>
          <span>{context}</span>
        </>
      )}
    </div>
  );
}
