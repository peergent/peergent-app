"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import type { RecommendedEmployee } from "@/lib/website-intelligence";

type RecommendedEmployeeCardProps = {
  employee: RecommendedEmployee;
  onCreatePeer: () => void;
};

function priorityLabel(priority: RecommendedEmployee["priority"]) {
  if (priority === "high") {
    return "High priority";
  }

  if (priority === "medium") {
    return "Recommended";
  }

  return "Optional";
}

function priorityStyles(priority: RecommendedEmployee["priority"]) {
  if (priority === "high") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (priority === "medium") {
    return "border-violet-500/20 bg-violet-500/10 text-violet-300";
  }

  return "border-white/10 bg-white/[0.04] text-slate-400";
}

export default function RecommendedEmployeeCard({
  employee,
  onCreatePeer,
}: RecommendedEmployeeCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#070b18]/80 shadow-xl shadow-black/10">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${employee.gradient} shadow-lg`}
            >
              <Sparkles size={22} />
            </div>

            <div>
              <h4 className="text-lg font-semibold">{employee.name}</h4>
              <p className="mt-1 text-sm text-violet-400">
                {employee.role} AI Employee
              </p>
            </div>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityStyles(employee.priority)}`}
          >
            {priorityLabel(employee.priority)}
          </span>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-400">
          {employee.rationale}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/[0.035] p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Estimated impact
            </p>
            <p className="mt-2 text-sm font-medium text-emerald-300">
              {employee.estimatedImpact}
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.035] p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Suggested objective
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {employee.suggestedObjective}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Ready to deploy as an AI Peer
          </p>
          <button
            type="button"
            onClick={onCreatePeer}
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 transition hover:text-violet-300"
          >
            Create peer
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
