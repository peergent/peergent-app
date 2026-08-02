/**
 * Project Brain module interfaces — architecture prep only.
 * Brains will later power each workflow step; builders consume these stubs today.
 */

export type BrainModuleId =
  | "business"
  | "website"
  | "competitor"
  | "seo"
  | "strategy"
  | "channel"
  | "content"
  | "campaign"
  | "publishing"
  | "optimization";

export type BrainEvidenceItem = {
  id: string;
  label: string;
  value: string;
  source?: string;
};

export type BrainOutput = {
  moduleId: BrainModuleId;
  title: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  evidence: readonly BrainEvidenceItem[];
  generatedAt: string;
};

export type BrainContext = {
  peerId: string;
  projectId?: string;
  locale?: string | null;
};

/** Contract each Brain module will implement. */
export interface ProjectBrainModule {
  readonly id: BrainModuleId;
  analyze(context: BrainContext): Promise<BrainOutput | null>;
}

export type ProjectBrainRegistry = Partial<Record<BrainModuleId, ProjectBrainModule>>;

/** Maps workflow steps to the brain modules that will eventually produce their evidence. */
export const WORKFLOW_STEP_BRAIN_MODULES: Readonly<
  Record<string, readonly BrainModuleId[]>
> = {
  business_analyzed: ["business"],
  website_analyzed: ["website", "seo"],
  competitors_analyzed: ["competitor"],
  strategy_determined: ["strategy", "business", "competitor"],
  channels_selected: ["channel", "strategy"],
  deliverables_created: ["content", "channel"],
  waiting_for_approval: ["campaign"],
  scheduled: ["publishing", "campaign"],
  published: ["publishing"],
  optimizing: ["optimization", "publishing"],
};
