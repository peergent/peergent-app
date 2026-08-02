import type { MarketingProjectStatus } from "@/lib/peer-experience/marketing/projects/types";

/**
 * Customer-facing campaign states — calm vocabulary, no internal task engine.
 */
export type CustomerCampaignState =
  | "concept"
  | "planning"
  | "waiting_for_approval"
  | "in_production"
  | "scheduled"
  | "live"
  | "tracking_results"
  | "completed"
  | "blocked";

const NL: Record<CustomerCampaignState, string> = {
  concept: "Concept",
  planning: "Plan wordt voorbereid",
  waiting_for_approval: "Wacht op jouw goedkeuring",
  in_production: "In productie",
  scheduled: "Ingepland",
  live: "Live / verzonden",
  tracking_results: "Resultaten worden gevolgd",
  completed: "Afgerond",
  blocked: "Geblokkeerd",
};

const EN: Record<CustomerCampaignState, string> = {
  concept: "Concept",
  planning: "Plan is being prepared",
  waiting_for_approval: "Waiting for your approval",
  in_production: "In production",
  scheduled: "Scheduled",
  live: "Live / sent",
  tracking_results: "Tracking results",
  completed: "Completed",
  blocked: "Blocked",
};

export function mapProjectStatusToCustomerState(
  status: MarketingProjectStatus,
  opts?: { hasPendingReview?: boolean; blocked?: boolean }
): CustomerCampaignState {
  if (opts?.blocked) return "blocked";
  if (status === "planning") return opts?.hasPendingReview ? "waiting_for_approval" : "planning";
  if (status === "preparing") return "in_production";
  if (status === "waiting_for_review") return "waiting_for_approval";
  if (status === "scheduled") return "scheduled";
  if (status === "publishing") return "live";
  if (status === "monitoring_results") return "tracking_results";
  if (status === "completed") return "completed";
  if (status === "archived") return "completed";
  return "planning";
}

export function customerCampaignStateLabel(
  state: CustomerCampaignState,
  locale?: string | null
): string {
  const table = locale === "nl" ? NL : EN;
  return table[state];
}

export function customerLabelForProjectStatus(
  status: MarketingProjectStatus,
  locale?: string | null,
  opts?: { hasPendingReview?: boolean; blocked?: boolean }
): string {
  return customerCampaignStateLabel(
    mapProjectStatusToCustomerState(status, opts),
    locale
  );
}
