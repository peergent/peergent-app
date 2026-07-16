import SignalDots from "@/components/website-intelligence/intelligence/SignalDots";
import type { SignalStripItem } from "@/lib/website-intelligence/assessment-presenter";
import { cn } from "@/lib/ui/cn";

type BusinessSignalStripProps = {
  items: SignalStripItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
};

export default function BusinessSignalStrip({
  items,
  activeId,
  onSelect,
}: BusinessSignalStripProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          className={cn(
            "flex min-w-[88px] flex-col gap-2 rounded-2xl border px-3 py-2.5 text-left transition duration-200",
            activeId === item.id
              ? "border-violet-500/25 bg-violet-500/[0.06] shadow-[0_0_24px_rgba(124,58,237,0.08)]"
              : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]"
          )}
        >
          <SignalDots strength={item.strength} state={item.state} />
          <span className="text-[11px] font-medium text-slate-400">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
