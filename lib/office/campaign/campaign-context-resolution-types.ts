import type { LiveCampaignBrandContext, CampaignCompetitorPersistEntry } from "./live-campaign-context-store";
import type { CampaignCompanyContextValidationResult } from "./campaign-company-context-validation";

/** Canonical context kinds resolvable via the unified human-input bridge. */
export type CampaignContextResolutionKind = "company" | "website" | "competitors";

export type CampaignContextResolutionDecision = "supplied" | "skipped";

export type CampaignContextResolutionInput =
  | {
      kind: "company";
      decision: "supplied";
      brandContext: LiveCampaignBrandContext;
    }
  | {
      kind: "website";
      decision: "supplied";
      url: string;
    }
  | {
      kind: "website";
      decision: "skipped";
    }
  | {
      kind: "competitors";
      decision: "supplied";
      competitors: readonly { name: string; url?: string }[];
    }
  | {
      kind: "competitors";
      decision: "skipped";
    };

export type CampaignContextResolutionValidationError =
  | { kind: "company"; errors: CampaignCompanyContextValidationResult }
  | { kind: "website"; error: "invalid_url" }
  | { kind: "competitors"; error: "empty_list" };

export type SubmitCampaignContextResolutionServerResult =
  | {
      ok: true;
      project: import("@/lib/peer-experience/marketing/projects/types").MarketingProject;
      episodeResumed: boolean;
      contextPersisted: boolean;
      resolutionKind: CampaignContextResolutionKind;
      resumeError?: string;
      runtimeSync?: import("./campaign-runtime-projection-sync").CampaignRuntimeSyncPayload;
    }
  | {
      ok: false;
      error:
        | "validation_failed"
        | "episode_not_found"
        | "episode_not_waiting"
        | "persist_failed"
        | "invalid_project"
        | "context_persistence_failed";
      validation?: CampaignContextResolutionValidationError;
    };
