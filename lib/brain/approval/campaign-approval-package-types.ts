/**
 * PX-57 — canonical campaign approval package.
 * Represents exactly what a human authorizes before external execution.
 */

import type { CreativeChannelId, CreativeDeliverableType } from "../llm/creative-generation-contract";
import type { PublicationReadiness } from "../layers/validation/types";

export type CampaignApprovalPackageVersion = {
  readonly creativeGraphRef: string;
  readonly validationGraphRef: string;
  readonly planningGraphRef: string | null;
  readonly strategyGraphRef: string | null;
  readonly packageId: string;
  readonly materializedAt: string;
};

export type CampaignApprovalDeliverableContent = {
  readonly id: string;
  readonly sourceDeliverableId: string;
  readonly channel: CreativeChannelId;
  readonly format: string;
  readonly deliverableType: CreativeDeliverableType;
  readonly headline: string;
  readonly hook: string;
  readonly body: string;
  readonly cta: string;
  readonly targetAudience: string;
  readonly intendedTiming: string | null;
  readonly subject: string | null;
  readonly previewText: string | null;
  readonly slides: readonly { readonly title: string; readonly body: string }[];
  readonly hashtags: readonly string[];
  readonly mediaNotes: string | null;
  readonly validationStatus: "passed" | "failed" | "pending";
  readonly validationSummary: string | null;
};

export type CampaignApprovalPackage = {
  readonly version: CampaignApprovalPackageVersion;
  readonly campaign: {
    readonly projectId: string;
    readonly organizationId: string;
    readonly name: string;
    readonly objective: string;
    readonly audience: string;
    readonly strategicRationale: string;
    readonly channels: readonly string[];
    readonly scheduleSummary: string | null;
  };
  readonly strategySummary: string;
  readonly validation: {
    readonly publicationReadiness: PublicationReadiness;
    readonly overallScore: number;
    readonly summary: string;
    readonly blockingIssueCount: number;
  };
  readonly deliverables: readonly CampaignApprovalDeliverableContent[];
  readonly executionPlan: {
    readonly mode: "semi_automatic" | "manual" | "fully_automatic";
    readonly readyForHandoff: boolean;
    readonly blockedReason: string | null;
  };
  readonly blockingIssues: readonly {
    readonly code: string;
    readonly message: string;
    readonly field?: string;
  }[];
  readonly publicationReady: boolean;
};
