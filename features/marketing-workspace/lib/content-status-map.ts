import type { MarketingContentStatus } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type ContentFilterId = "all" | MarketingContentStatus | "rejected";

export const CONTENT_FILTERS: Array<{ id: ContentFilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "scheduled", label: "Scheduled" },
  { id: "ready_for_review", label: "Pending" },
  { id: "draft", label: "Draft" },
  { id: "rejected", label: "Rejected" },
];

export function contentMatchesFilter(status: MarketingContentStatus, filter: ContentFilterId): boolean {
  if (filter === "all") return true;
  if (filter === "ready_for_review") return status === "ready_for_review" || status === "approved";
  return status === filter;
}

export function contentStatusClass(status: MarketingContentStatus): string {
  switch (status) {
    case "published":
      return "mw-out-published";
    case "scheduled":
      return "mw-out-scheduled";
    case "ready_for_review":
    case "approved":
      return "mw-out-pending";
    case "draft":
      return "mw-out-draft";
    default:
      return "mw-out-draft";
  }
}

export function contentStatusLabel(status: MarketingContentStatus): string {
  switch (status) {
    case "published":
      return "Published";
    case "scheduled":
      return "Scheduled";
    case "ready_for_review":
      return "Pending review";
    case "approved":
      return "Approved";
    case "draft":
      return "Draft";
    default:
      return String(status).replace(/_/g, " ");
  }
}
