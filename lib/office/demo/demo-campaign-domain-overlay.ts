import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { DemoStepApprovalStatus } from "./demo-workflow-simulation";

export type DemoCampaignSchedule = {
  readonly scheduledAt: string;
  readonly channels: readonly string[];
  readonly deliverableIds: readonly string[];
};

export type DemoCampaignPublished = {
  readonly publishedAt: string;
};

export type DemoCampaignActivityEvent = {
  readonly id: string;
  readonly projectId: string;
  readonly kind: "scheduled" | "published" | "step_approved" | "deliverable_approved";
  readonly title: string;
  readonly description: string;
  readonly at: string;
};

/** Overlay fields merged onto demo domain input — never used for live peers. */
export type DemoCampaignDomainOverlay = {
  demoCampaignStepApprovals?: Readonly<
    Record<string, Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>>
  >;
  demoCampaignSchedule?: Readonly<Record<string, DemoCampaignSchedule>>;
  demoCampaignPublished?: Readonly<Record<string, DemoCampaignPublished>>;
  demoCampaignActivity?: readonly DemoCampaignActivityEvent[];
  demoCampaignContexts?: Readonly<Record<string, import("@/lib/office/campaign/campaign-context").CampaignContext>>;
};

export function readDemoCampaignOverlay(
  domainInput: unknown
): DemoCampaignDomainOverlay {
  return (domainInput ?? {}) as DemoCampaignDomainOverlay;
}
