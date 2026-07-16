"use client";

import { ArrowRight } from "lucide-react";
import ChapterDisclosure from "@/components/website-intelligence/ChapterDisclosure";
import EvidenceBadge from "@/components/website-intelligence/EvidenceBadge";
import type { WorkforceRecommendation } from "@/lib/website-intelligence";

type RecommendedEmployeeCardProps = {
  employee: WorkforceRecommendation;
  onCreatePeer: () => void;
  variant?: "compact" | "detail";
};

export default function RecommendedEmployeeCard({
  employee,
  onCreatePeer,
  variant = "compact",
}: RecommendedEmployeeCardProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{employee.name}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{employee.whyRecommended}</p>
        </div>
        <button
          type="button"
          onClick={onCreatePeer}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-400 transition hover:text-violet-300"
        >
          Create
          <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <article className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{employee.name}</p>
          <p className="mt-0.5 text-xs text-violet-400/80">{employee.role}</p>
        </div>
        <button
          type="button"
          onClick={onCreatePeer}
          className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 transition hover:text-violet-300"
        >
          Create peer
          <ArrowRight size={12} />
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{employee.whyRecommended}</p>

      {employee.supportingFindings.length > 0 && (
        <ChapterDisclosure label="Supporting evidence">
          <ul className="space-y-2">
            {employee.supportingFindings.map((finding) => (
              <li
                key={finding.id}
                className="flex flex-wrap items-start justify-between gap-2"
              >
                <p className="text-xs leading-5 text-slate-500">{finding.statement}</p>
                <EvidenceBadge category={finding.category} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-600">{employee.suggestedObjective}</p>
        </ChapterDisclosure>
      )}
    </article>
  );
}
