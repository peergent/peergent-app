import { cn } from "@/lib/ui/cn";
import type { SignalState } from "@/lib/website-intelligence/assessment-presenter";

type SignalDotsProps = {
  strength: 1 | 2 | 3;
  state: SignalState;
  className?: string;
};

const stateColors: Record<SignalState, string> = {
  strong: "bg-emerald-400",
  opportunity: "bg-violet-400",
  "needs-data": "bg-amber-400",
  unknown: "bg-slate-600",
};

export default function SignalDots({ strength, state, className }: SignalDotsProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-opacity",
            i <= strength ? stateColors[state] : "bg-white/10"
          )}
        />
      ))}
    </div>
  );
}
