import Link from "next/link";
import {
  CircleDashed,
  Globe,
  BookOpen,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import ReportChapter from "@/components/dashboard/ReportChapter";
import StatusBadge from "@/components/ui/StatusBadge";
import type { CoverageItem } from "@/lib/command-center/types";

type IntelligenceCoverageProps = {
  items: CoverageItem[];
};

function getSourceIcon(id: string): LucideIcon {
  if (id.includes("website")) return Globe;
  if (id.includes("knowledge")) return BookOpen;
  if (id.includes("analytics")) return BarChart3;
  return CircleDashed;
}

function statusLabel(status: CoverageItem["status"]) {
  const labels = {
    connected: "Connected",
    partial: "Watching",
    "not-connected": "Waiting",
    "not-started": "Waiting",
  };

  return labels[status];
}

function mapStatus(
  status: CoverageItem["status"]
): "connected" | "watching" | "waiting" {
  if (status === "connected") return "connected";
  if (status === "partial") return "watching";
  return "waiting";
}

export default function IntelligenceCoverage({
  items,
}: IntelligenceCoverageProps) {
  return (
    <ReportChapter step={6} icon={CircleDashed} title="What I'm still missing">
      <ul className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {items.map((item) => {
          const Icon = getSourceIcon(item.id);

          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-5"
            >
              <div className="flex min-w-0 gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--pg-radius-md)] border border-white/[0.06] bg-white/[0.02] text-slate-500">
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/85">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-600">
                    {item.detail}
                  </p>
                  {item.href && (
                    <Link
                      href={item.href}
                      className="mt-1 inline-block text-xs text-violet-400/80 transition hover:text-violet-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </div>

              <StatusBadge
                status={mapStatus(item.status)}
                label={statusLabel(item.status)}
                className="shrink-0"
              />
            </li>
          );
        })}
      </ul>
    </ReportChapter>
  );
}
