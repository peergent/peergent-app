import Link from "next/link";
import EvidenceBadge from "@/components/website-intelligence/EvidenceBadge";
import type { InsightObject } from "@/lib/website-intelligence/assessment-presenter";
import { cn } from "@/lib/ui/cn";
import {
  Globe,
  TrendingUp,
  Headphones,
  Zap,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

const categoryIcons: Record<InsightObject["category"], LucideIcon> = {
  observed: Globe,
  likely: TrendingUp,
  unknown: CircleHelp,
  "requires-more-data": Headphones,
};

type SignalChipProps = {
  insight: InsightObject;
  className?: string;
};

export function SignalChip({ insight, className }: SignalChipProps) {
  const Icon = categoryIcons[insight.category] ?? Zap;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-2 pr-3 transition duration-200 hover:border-white/[0.14] hover:bg-white/[0.05]",
        className
      )}
    >
      <Icon size={12} className="shrink-0 text-violet-400/70" strokeWidth={1.75} />
      <span className="text-xs font-medium text-slate-300">{insight.title}</span>
      <EvidenceBadge category={insight.category} />
    </div>
  );
}

type GapChipProps = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export function GapChip({ label, href, onClick }: GapChipProps) {
  const className =
    "inline-flex items-center rounded-full border border-dashed border-white/[0.12] bg-transparent px-3 py-1.5 text-xs font-medium text-slate-500 transition duration-200 hover:border-violet-500/30 hover:text-violet-300";

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}
