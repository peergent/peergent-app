"use client";

import type { ProjectNextStepViewModel } from "@/lib/peer-experience/marketing/projects/project-experience-types";

export type ProjectNextStepProps = {
  nextStep: ProjectNextStepViewModel;
};

export default function ProjectNextStep({ nextStep }: ProjectNextStepProps) {
  return (
    <section className="mp-project-next">
      <h3 className="mp-project-section__title">What happens next</h3>
      <p className="mp-project-next__label">{nextStep.label}</p>
      {nextStep.blocked && nextStep.blockerReason && (
        <p className="mp-project-next__blocker">{nextStep.blockerReason}</p>
      )}
    </section>
  );
}
