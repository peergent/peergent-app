import type { MarketingPerformanceFilters } from "../domain/marketing-peer-types";

export type MarketingPeerTabId =
  | "overview"
  | "review"
  | "work"
  | "content"
  | "performance"
  | "connections"
  | "responsibilities"
  | "knowledge"
  | "settings"
  | "projects";

export type MarketingPeerTab = {
  id: MarketingPeerTabId;
  label: string;
  href: (peerId: string) => string;
};

export const MARKETING_PEER_TABS: MarketingPeerTab[] = [
  { id: "overview", label: "Overview", href: (peerId) => `/team/${peerId}` },
  { id: "review", label: "Review", href: (peerId) => `/team/${peerId}/review` },
  { id: "work", label: "Projects", href: (peerId) => `/team/${peerId}/work` },
  { id: "content", label: "Content", href: (peerId) => `/team/${peerId}/content` },
  { id: "performance", label: "Performance", href: (peerId) => `/team/${peerId}/performance` },
  { id: "connections", label: "Connections", href: (peerId) => `/team/${peerId}/connections` },
  { id: "responsibilities", label: "Responsibilities", href: (peerId) => `/team/${peerId}/responsibilities` },
  { id: "knowledge", label: "Knowledge", href: (peerId) => `/team/${peerId}/knowledge` },
  { id: "settings", label: "Settings", href: (peerId) => `/team/${peerId}/settings` },
];

export function marketingPeerTabHref(peerId: string, tab: MarketingPeerTabId): string {
  const match = MARKETING_PEER_TABS.find((t) => t.id === tab);
  return match ? match.href(peerId) : `/team/${peerId}`;
}

export function resolveActiveMarketingPeerTab(pathname: string, peerId: string): MarketingPeerTabId {
  const base = `/team/${peerId}`;
  if (pathname === base || pathname === `${base}/`) return "overview";
  if (pathname.startsWith(`${base}/projects/`)) return "work";
  for (const tab of MARKETING_PEER_TABS) {
    if (tab.id === "overview") continue;
    const href = tab.href(peerId);
    if (pathname === href || pathname.startsWith(`${href}/`)) return tab.id;
  }
  return "overview";
}

/** Review deliverable deep link — supports deliverableId (preferred) and legacy draft param. */
export function getReviewHref(peerId: string, deliverableId?: string, filter?: string): string {
  const base = `/team/${peerId}/review`;
  const params = new URLSearchParams();
  if (deliverableId) params.set("deliverableId", deliverableId);
  if (filter) params.set("filter", filter);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function parseReviewSearchParams(searchParams: URLSearchParams): {
  deliverableId: string | null;
  filter: string | null;
} {
  return {
    deliverableId:
      searchParams.get("deliverableId") ??
      searchParams.get("draft") ??
      null,
    filter: searchParams.get("filter"),
  };
}

export function getWorkHref(peerId: string, workUnitId?: string): string {
  const base = `/team/${peerId}/work`;
  if (!workUnitId) return base;
  const params = new URLSearchParams();
  params.set("workUnitId", workUnitId);
  return `${base}?${params.toString()}`;
}

export function getProjectHref(peerId: string, projectId?: string, section?: string): string {
  const base = projectId
    ? `/team/${peerId}/projects/${encodeURIComponent(projectId)}`
    : `/team/${peerId}/work`;
  if (!section) return base;
  const params = new URLSearchParams();
  params.set("section", section);
  return `${base}?${params.toString()}`;
}

/** Campaign cards reuse the project detail route when a matching project exists. */
export function getMarketingCampaignHref(peerId: string, campaignId: string): string {
  return getProjectHref(peerId, campaignId);
}

export function getProjectReviewHref(
  peerId: string,
  projectId: string,
  deliverableId?: string
): string {
  const base = getProjectHref(peerId, projectId, "reviews");
  if (!deliverableId) return base;
  const params = new URLSearchParams({ section: "reviews", deliverableId });
  return `/team/${peerId}/projects/${encodeURIComponent(projectId)}?${params.toString()}`;
}

/** Customer review surface for a prepared campaign artifact (review item id = work unit id). */
export function getCampaignReviewItemHref(
  peerId: string,
  projectId: string,
  reviewItemId: string
): string {
  return `/team/${peerId}/projects/${encodeURIComponent(projectId)}/review/${encodeURIComponent(reviewItemId)}`;
}

export function getCampaignInspectorHref(peerId: string, projectId: string): string {
  return `/team/${peerId}/projects/${encodeURIComponent(projectId)}/inspector`;
}

export function parseProjectSearchParams(searchParams: URLSearchParams): {
  section: string | null;
  deliverableId: string | null;
} {
  return {
    section: searchParams.get("section"),
    deliverableId:
      searchParams.get("deliverableId") ?? searchParams.get("draft") ?? null,
  };
}

export function resolveWorkUnitProjectHref(
  peerId: string,
  workUnitId: string,
  workUnits: Array<{ id: string; projectId?: string | null }>
): string {
  const projectId = workUnits.find((u) => u.id === workUnitId)?.projectId;
  return projectId ? getProjectHref(peerId, projectId) : getWorkHref(peerId);
}

export function parseWorkSearchParams(searchParams: URLSearchParams): {
  workUnitId: string | null;
  filter: string | null;
} {
  return {
    workUnitId: searchParams.get("workUnitId") ?? searchParams.get("unit") ?? null,
    filter: searchParams.get("filter"),
  };
}

export function getContentHref(peerId: string, contentId?: string): string {
  const base = `/team/${peerId}/content`;
  return contentId ? `${base}/${encodeURIComponent(contentId)}` : base;
}

export function getPerformanceHref(peerId: string, filters?: MarketingPerformanceFilters): string {
  const base = `/team/${peerId}/performance`;
  if (!filters) return base;
  const params = new URLSearchParams();
  if (filters.contentId) params.set("contentId", filters.contentId);
  if (filters.campaignId) params.set("campaignId", filters.campaignId);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.period) params.set("period", filters.period);
  if (filters.view) params.set("view", filters.view);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function getPerformanceInsightsHref(peerId: string): string {
  return getPerformanceHref(peerId, { view: "insights" });
}

export function getResponsibilitiesHref(peerId: string): string {
  return `/team/${peerId}/responsibilities`;
}

export function getResponsibilityHref(peerId: string, responsibilityId?: string): string {
  const base = getResponsibilitiesHref(peerId);
  return responsibilityId
    ? `${base}/${encodeURIComponent(responsibilityId)}`
    : base;
}

/** @deprecated Use getResponsibilitiesHref — automations route redirects to responsibilities. */
export function getAutomationHref(peerId: string, _automationId?: string): string {
  return getResponsibilitiesHref(peerId);
}

export function getKnowledgeHref(peerId: string, section?: string): string {
  const base = `/team/${peerId}/knowledge`;
  return section ? `${base}?section=${encodeURIComponent(section)}` : base;
}

export function getSettingsHref(peerId: string, section?: string): string {
  const base = `/team/${peerId}/settings`;
  return section ? `${base}?section=${encodeURIComponent(section)}` : base;
}

export function getIntegrationsHref(): string {
  return "/integrations";
}

export function getConnectionsHref(peerId: string): string {
  return `/team/${peerId}/connections`;
}
