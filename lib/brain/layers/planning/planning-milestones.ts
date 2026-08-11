import type { PlanningBrainMilestone, PlanningEntityStatus } from "./brain-types";

const MILESTONE_TEMPLATES = [
  { title: "Strategy approved", description: "Strategy decisions approved by customer", blocking: true },
  { title: "Creative direction ready", description: "Creative briefs approved for production", blocking: false },
  { title: "Creative deliverables complete", description: "Creative Brain outputs ready for validation", blocking: false },
  { title: "Validation passed", description: "Validation Brain approved deliverables", blocking: true },
  { title: "Customer approval complete", description: "Customer signed off on campaign assets", blocking: true },
  { title: "Ready for publication", description: "All prerequisites satisfied for execution", blocking: true },
  { title: "Campaign launched", description: "Execution Brain published initial campaign", blocking: false },
  { title: "First performance review", description: "Initial performance checkpoint", blocking: false },
];

export function buildMilestones(input: {
  campaignId: string;
  targetWindow: string | null;
}): PlanningBrainMilestone[] {
  return MILESTONE_TEMPLATES.map((m, i) => ({
    id: `ms-${input.campaignId}-${i}`,
    campaignId: input.campaignId,
    title: m.title,
    description: m.description,
    entryCriteria: i === 0 ? ["Strategy review complete"] : [`Previous milestone: ${MILESTONE_TEMPLATES[i - 1]?.title}`],
    exitCriteria: [`${m.title} criteria met`],
    dependencies: i > 0 ? [`ms-${input.campaignId}-${i - 1}`] : [],
    targetWindow: input.targetWindow,
    status: "NOT_STARTED" as PlanningEntityStatus,
    blocking: m.blocking,
  }));
}
