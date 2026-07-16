"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ButtonLink from "@/components/ui/ButtonLink";
import OverviewHero from "@/components/website-intelligence/intelligence/OverviewHero";
import ModelRail from "@/components/website-intelligence/intelligence/ModelRail";
import BusinessSignalStrip from "@/components/website-intelligence/intelligence/BusinessSignalStrip";
import BusinessModelZone from "@/components/website-intelligence/intelligence/BusinessModelZone";
import GrowthZone from "@/components/website-intelligence/intelligence/GrowthZone";
import ExecutionZone from "@/components/website-intelligence/intelligence/ExecutionZone";
import WorkforceZone from "@/components/website-intelligence/intelligence/WorkforceZone";
import {
  buildAssessmentViewModel,
  type ModelZoneId,
  type PeerViewModel,
} from "@/lib/website-intelligence/assessment-presenter";
import type {
  WebsiteIntelligenceAssessment,
  WorkforceRecommendation,
} from "@/lib/website-intelligence";

type AssessmentCanvasProps = {
  assessment: WebsiteIntelligenceAssessment;
  onAnalyzeAnother: () => void;
  onOpenCreatePeer: (employee: WorkforceRecommendation) => void;
};

const zoneSections: { id: ModelZoneId; title: string }[] = [
  { id: "overview", title: "Overview" },
  { id: "business-model", title: "Business Model" },
  { id: "growth", title: "Growth" },
  { id: "execution", title: "Execution" },
  { id: "workforce", title: "AI Workforce" },
];

export default function AssessmentCanvas({
  assessment,
  onAnalyzeAnother,
  onOpenCreatePeer,
}: AssessmentCanvasProps) {
  const model = useMemo(() => buildAssessmentViewModel(assessment), [assessment]);
  const [activeZone, setActiveZone] = useState<ModelZoneId>("overview");
  const sectionRefs = useRef<Partial<Record<ModelZoneId, HTMLElement | null>>>({});

  const scrollToZone = useCallback((zone: ModelZoneId) => {
    sectionRefs.current[zone]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveZone(zone);
  }, []);

  useEffect(() => {
    const elements = zoneSections
      .map(({ id }) => sectionRefs.current[id])
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveZone(visible.target.id as ModelZoneId);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.12, 0.3, 0.5] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function handleDeploy(peer: PeerViewModel) {
    onOpenCreatePeer(peer.employee);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <ModelRail activeZone={activeZone} onSelect={scrollToZone} />

        <div className="min-w-0 flex-1 space-y-16 md:space-y-20">
          <section
            id="overview"
            ref={(el) => {
              sectionRefs.current.overview = el;
            }}
            className="scroll-mt-24"
          >
            <OverviewHero
              model={model}
              onDeploy={() => handleDeploy(model.overview.primaryPeer)}
            />
            <div className="mt-8">
              <BusinessSignalStrip
                items={model.signalStrip}
                onSelect={(id) => {
                  const map: Record<string, ModelZoneId> = {
                    company: "business-model",
                    journey: "growth",
                    marketing: "growth",
                    ops: "execution",
                    workforce: "workforce",
                  };
                  scrollToZone(map[id] ?? "overview");
                }}
              />
            </div>
          </section>

          <section
            id="business-model"
            ref={(el) => {
              sectionRefs.current["business-model"] = el;
            }}
          >
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
              Business Model
            </p>
            <BusinessModelZone zone={model.businessModel} />
          </section>

          <section
            id="growth"
            ref={(el) => {
              sectionRefs.current.growth = el;
            }}
          >
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
              Growth
            </p>
            <GrowthZone zone={model.growth} />
          </section>

          <section
            id="execution"
            ref={(el) => {
              sectionRefs.current.execution = el;
            }}
          >
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
              Execution
            </p>
            <ExecutionZone zone={model.execution} />
          </section>

          <section
            id="workforce"
            ref={(el) => {
              sectionRefs.current.workforce = el;
            }}
          >
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
              AI Workforce
            </p>
            <WorkforceZone
              peers={model.workforce.peers}
              decision={model.decision}
              onDeploy={handleDeploy}
            />
          </section>

          <div className="flex flex-wrap gap-4 border-t border-white/[0.06] pt-8">
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
      </div>
    </div>
  );
}
