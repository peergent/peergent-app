import type { MarketingPerformanceFilters } from "../domain/marketing-peer-types";
import {
  MARKETING_PEER_SECTIONS,
  marketingPeerSectionHref,
  resolveActiveMarketingPeerSection,
  type MarketingPeerSectionId,
  type MarketingPeerTabId,
} from "./marketing-peer-sections";

export type { MarketingPeerSectionId, MarketingPeerTabId } from "./marketing-peer-sections";
export {
  MARKETING_PEER_SECTIONS,
  marketingPeerSectionHref,
  resolveActiveMarketingPeerSection,
  legacyTabToSection,
} from "./marketing-peer-sections";

export type MarketingPeerTab = {
  id: MarketingPeerSectionId;
  label: string;
  href: (peerId: string) => string;
};

/** Primary customer navigation (English labels for tests and fallbacks). */
export const MARKETING_PEER_TABS: MarketingPeerTab[] = [
  { id: "today", label: "Today", href: (peerId) => `/team/${peerId}` },
  { id: "work", label: "Work", href: (peerId) => `/team/${peerId}/work` },
  { id: "results", label: "Results", href: (peerId) => `/team/${peerId}/results` },
  { id: "settings", label: "Settings", href: (peerId) => `/team/${peerId}/settings` },
];

export const MARKETING_PEER_SECTIONS_NAV = MARKETING_PEER_SECTIONS;

export function marketingPeerTabHref(
  peerId: string,
  tab: MarketingPeerTabId | MarketingPeerSectionId
): string {
  if (MARKETING_PEER_SECTIONS.some((s) => s.id === tab)) {
    return marketingPeerSectionHref(peerId, tab as MarketingPeerSectionId);
  }
  const legacyMap: Partial<Record<MarketingPeerTabId, MarketingPeerSectionId>> = {
    overview: "today",
    working_on: "today",
    waiting_for_me: "today",
    done: "today",
    review: "waiting_for_me",
    content: "work",
    performance: "results",
    connections: "settings",
    responsibilities: "settings",
    knowledge: "settings",
    projects: "work",
  };
  const section = legacyMap[tab as MarketingPeerTabId] ?? "today";
  return marketingPeerSectionHref(peerId, section);
}

export function resolveActiveMarketingPeerTab(
  pathname: string,
  peerId: string
): MarketingPeerSectionId {
  return resolveActiveMarketingPeerSection(pathname, peerId);
}

/** Review deliverable deep link — supports deliverableId (preferred) and legacy draft param. */
export function getReviewHref(peerId: string, deliverableId?: string, filter?: string): string {
  const base = `/team/${peerId}/waiting`;
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
  const base = `/team/${peerId}/results`;
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
