/** Customer-facing Marketing Peer workspace sections (Sprint 29C — four primary tabs). */
export type MarketingPeerCustomerSectionId = "today" | "work" | "results" | "settings";

/** Legacy section ids kept for deep links and internal routing. */
export type MarketingPeerLegacySectionId = "working_on" | "waiting_for_me" | "done";

export type MarketingPeerSectionId =
  | MarketingPeerCustomerSectionId
  | MarketingPeerLegacySectionId;

/** @deprecated Legacy tab ids — map to sections via `legacyTabToSection`. */
export type MarketingPeerTabId =
  | MarketingPeerSectionId
  | "overview"
  | "review"
  | "content"
  | "performance"
  | "connections"
  | "responsibilities"
  | "knowledge"
  | "projects";

export type MarketingPeerSection = {
  id: MarketingPeerCustomerSectionId;
  href: (peerId: string) => string;
};

/** Primary customer navigation (Vandaag / Work / Results / Settings). */
export const MARKETING_PEER_SECTIONS: MarketingPeerSection[] = [
  { id: "today", href: (peerId) => `/team/${peerId}` },
  { id: "work", href: (peerId) => `/team/${peerId}/work` },
  { id: "results", href: (peerId) => `/team/${peerId}/results` },
  { id: "settings", href: (peerId) => `/team/${peerId}/settings` },
];

export function marketingPeerSectionHref(
  peerId: string,
  section: MarketingPeerSectionId
): string {
  switch (section) {
    case "working_on":
    case "waiting_for_me":
    case "done":
    case "today":
      return `/team/${peerId}`;
    case "work":
      return `/team/${peerId}/work`;
    case "results":
      return `/team/${peerId}/results`;
    case "settings":
      return `/team/${peerId}/settings`;
    default:
      return `/team/${peerId}`;
  }
}

export function legacyTabToSection(tab: MarketingPeerTabId): MarketingPeerSectionId {
  switch (tab) {
    case "overview":
    case "working_on":
    case "waiting_for_me":
    case "done":
    case "today":
      return "today";
    case "review":
      return "waiting_for_me";
    case "work":
    case "projects":
    case "content":
      return "work";
    case "performance":
    case "results":
      return "results";
    case "settings":
    case "connections":
    case "responsibilities":
    case "knowledge":
      return "settings";
    default:
      return "today";
  }
}

/** Nav highlight: legacy waiting/done routes map to Today. */
export function resolveActiveMarketingPeerCustomerSection(
  pathname: string,
  peerId: string
): MarketingPeerCustomerSectionId {
  const base = `/team/${peerId}`;
  if (
    pathname === base ||
    pathname === `${base}/` ||
    pathname.startsWith(`${base}/waiting`) ||
    pathname.startsWith(`${base}/done`) ||
    pathname.startsWith(`${base}/review`)
  ) {
    return "today";
  }
  if (pathname.startsWith(`${base}/projects/`) || pathname.startsWith(`${base}/content/`)) {
    return "work";
  }

  for (const section of MARKETING_PEER_SECTIONS) {
    if (section.id === "today") continue;
    const href = section.href(peerId);
    if (pathname === href || pathname.startsWith(`${href}/`)) return section.id;
  }

  if (pathname.startsWith(`${base}/performance`)) return "results";
  if (
    pathname.startsWith(`${base}/knowledge`) ||
    pathname.startsWith(`${base}/connections`) ||
    pathname.startsWith(`${base}/responsibilities`) ||
    pathname.startsWith(`${base}/automations`)
  ) {
    return "settings";
  }

  return "today";
}

export function resolveActiveMarketingPeerSection(
  pathname: string,
  peerId: string
): MarketingPeerSectionId {
  const customer = resolveActiveMarketingPeerCustomerSection(pathname, peerId);
  if (customer !== "today") return customer;
  const base = `/team/${peerId}`;
  if (pathname.startsWith(`${base}/waiting`) || pathname.startsWith(`${base}/review`)) {
    return "waiting_for_me";
  }
  if (pathname.startsWith(`${base}/done`)) return "done";
  if (pathname === base || pathname === `${base}/`) return "working_on";
  return "today";
}

/** @deprecated Use resolveActiveMarketingPeerSection */
export function resolveActiveMarketingPeerTab(
  pathname: string,
  peerId: string
): MarketingPeerTabId {
  return resolveActiveMarketingPeerSection(pathname, peerId);
}
