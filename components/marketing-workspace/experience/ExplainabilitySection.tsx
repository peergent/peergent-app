"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { ExplainabilityView } from "@/lib/marketing-workspace/experience";
import { cn } from "@/lib/ui/cn";

type ExplainabilitySectionProps = {
  view: ExplainabilityView;
  defaultOpen?: boolean;
};

export default function ExplainabilitySection({
  view,
  defaultOpen = false,
}: ExplainabilitySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pg-focus-premium flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
          <HelpCircle size={14} />
          Why did you create this?
        </span>
        <ChevronDown
          size={14}
          className={cn("text-slate-600 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600">Reasoning</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{view.reasoning}</p>
          </div>

          {view.evidence.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600">Evidence</p>
              <ul className="mt-1.5 space-y-1">
                {view.evidence.map((item, i) => (
                  <li key={i} className="text-sm text-slate-400">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {view.sourceReferences.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                Source references
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {view.sourceReferences.map((ref) => (
                  <Badge key={ref} variant="neutral" size="sm">
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {view.confidence && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600">Confidence</p>
              <Badge
                variant={
                  view.confidence === "high"
                    ? "success"
                    : view.confidence === "moderate"
                      ? "warning"
                      : "neutral"
                }
                size="sm"
                className="mt-1.5"
              >
                {view.confidence}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
