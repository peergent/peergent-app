"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import ButtonLink from "@/components/ui/ButtonLink";
import BusinessBrainViewport from "@/components/website-intelligence/intelligence/BusinessBrainViewport";
import AssessmentBrainDetails from "@/components/website-intelligence/AssessmentBrainDetails";
import ReasoningCanvas from "@/components/website-intelligence/intelligence/ReasoningCanvas";
import HireTeamCTA from "@/components/website-intelligence/intelligence/HireTeamCTA";
import {
  buildBusinessBrainReasoningViewModel,
  buildBusinessBrainViewModel,
} from "@/lib/website-intelligence/assessment-presenter";
import type { WebsiteIntelligenceAssessment } from "@/lib/website-intelligence";

type AssessmentCanvasProps = {
  assessment: WebsiteIntelligenceAssessment;
  onAnalyzeAnother: () => void;
  onStartHireTeam: () => void;
};

export default function AssessmentCanvas({
  assessment,
  onAnalyzeAnother,
  onStartHireTeam,
}: AssessmentCanvasProps) {
  const brain = useMemo(
    () => buildBusinessBrainViewModel(assessment),
    [assessment]
  );
  const reasoning = useMemo(
    () => buildBusinessBrainReasoningViewModel(assessment),
    [assessment]
  );

  return (
    <div className="mx-auto max-w-6xl">
      <BusinessBrainViewport brain={brain} onHireTeam={onStartHireTeam} />

      <ReasoningCanvas reasoning={reasoning} />

      <AssessmentBrainDetails assessment={assessment} />

      <HireTeamCTA onHireTeam={onStartHireTeam} />

      <div className="mx-auto flex max-w-xl flex-wrap gap-4 border-t border-white/[0.04] px-2 pt-6 pb-8">
        <button
          type="button"
          onClick={onAnalyzeAnother}
          className="text-xs text-slate-600 transition hover:text-slate-400"
        >
          New company
        </button>
        <ButtonLink href="/peers" variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
          Workforce
        </ButtonLink>
      </div>
    </div>
  );
}
