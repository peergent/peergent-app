/**
 * §3 / §7 The office of one Peer — six destinations, ordered Office → Records
 * → Agreement so the relational layer is always encountered first.
 *
 * Routes are rooted at `/office/` while the new architecture is isolated. The
 * frozen spec's sitemap says `/team/`; that rename happens in the deliberate
 * cutover phase, not here — pointing these at `/team` ejects the customer into
 * the legacy surface.
 *
 * Peer-agnostic by construction (§10): every Peer wears the same architecture,
 * so a customer who learns one can operate all of them. Six is a ceiling, not
 * a target — a seventh would force a dropdown and lose glanceability.
 */

export const OFFICE_DESTINATIONS = [
  "desk",
  "work",
  "performance",
  "content",
  "market",
  "agreement",
] as const;

export type OfficeDestinationId = (typeof OFFICE_DESTINATIONS)[number];

export type OfficeLayer = "office" | "records" | "agreement";

export type OfficeDestination = {
  id: OfficeDestinationId;
  label: string;
  layer: OfficeLayer;
  href: (peerId: string) => string;
  /** §3 Only the Desk carries a badge, and only for pending decisions. */
  badged: boolean;
};

export const OFFICE_DESTINATION_LIST: readonly OfficeDestination[] = [
  {
    id: "desk",
    label: "Workspace",
    layer: "office",
    href: (peerId) => `/office/${peerId}`,
    badged: true,
  },
  {
    id: "work",
    label: "Work",
    layer: "office",
    href: (peerId) => `/office/${peerId}/work`,
    badged: false,
  },
  {
    id: "performance",
    label: "Performance",
    layer: "records",
    href: (peerId) => `/office/${peerId}/performance`,
    badged: false,
  },
  {
    id: "content",
    label: "Content",
    layer: "records",
    href: (peerId) => `/office/${peerId}/content`,
    badged: false,
  },
  {
    id: "market",
    label: "Market",
    layer: "records",
    href: (peerId) => `/office/${peerId}/market`,
    badged: false,
  },
  {
    id: "agreement",
    label: "Working agreement",
    layer: "agreement",
    href: (peerId) => `/office/${peerId}/agreement`,
    badged: false,
  },
];

export function officeDestinationHref(
  peerId: string,
  id: OfficeDestinationId
): string {
  const destination = OFFICE_DESTINATION_LIST.find((d) => d.id === id);
  return destination ? destination.href(peerId) : `/office/${peerId}`;
}

/** Resolves the active destination from a pathname. Desk is the fallback. */
export function resolveOfficeDestination(
  pathname: string,
  peerId: string
): OfficeDestinationId {
  for (const destination of OFFICE_DESTINATION_LIST) {
    if (destination.id === "desk") continue;
    const href = destination.href(peerId);
    if (pathname === href || pathname.startsWith(`${href}/`)) return destination.id;
  }
  return "desk";
}

/**
 * Destination names in the customer's language.
 *
 * `label` on the destination stays English: it is the stable name the routing
 * and the tests use. This maps it for display, so navigation stops being the
 * one English thing left on a Dutch page.
 */
const DESTINATION_LABELS: Record<string, Record<OfficeDestinationId, string>> = {
  en: {
    desk: "Workspace",
    work: "Work",
    performance: "Performance",
    content: "Content",
    market: "Market",
    agreement: "Working agreement",
  },
  nl: {
    desk: "Werkplek",
    work: "Werk",
    performance: "Prestaties",
    content: "Content",
    market: "Markt",
    agreement: "Werkafspraak",
  },
};

export function officeDestinationLabel(
  destination: OfficeDestination,
  locale?: string | null
): string {
  const table = DESTINATION_LABELS[locale === "nl" ? "nl" : "en"];
  return table?.[destination.id] ?? destination.label;
}
