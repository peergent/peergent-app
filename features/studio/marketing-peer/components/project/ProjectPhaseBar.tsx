"use client";

import type { ProjectExperienceViewModel } from "@/lib/peer-experience/marketing/projects/project-experience-types";
import { cn } from "@/lib/ui/cn";

export type ProjectPhaseBarProps = {
  phases: ProjectExperienceViewModel["phases"];
};

export default function ProjectPhaseBar({ phases }: ProjectPhaseBarProps) {
  return (
    <nav className="mp-project-phases" aria-label="Project phases">
      {phases.map((phase) => (
        <div
          key={phase.id}
          className={cn(
            "mp-project-phases__item",
            phase.complete && "mp-project-phases__item--complete",
            phase.current && "mp-project-phases__item--current"
          )}
        >
          <span className="mp-project-phases__dot" aria-hidden />
          <span className="mp-project-phases__label">{phase.label}</span>
        </div>
      ))}
    </nav>
  );
}
