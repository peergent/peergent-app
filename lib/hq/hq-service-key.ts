import type { PeerRow } from "@/lib/peer-display";

/** Canonical HQ department keys — one card each on the landing page. */
export type HqServiceKey =
  | "marketing"
  | "sales"
  | "finance"
  | "support"
  | "operations";

export const HQ_SERVICE_DISPLAY_ORDER: HqServiceKey[] = [
  "sales",
  "marketing",
  "finance",
  "support",
  "operations",
];

export const HQ_SERVICE_LABELS: Record<HqServiceKey, string> = {
  sales: "Sales",
  marketing: "Marketing",
  finance: "Finance",
  support: "Support",
  operations: "Operations",
};

/** Exact match on PeerRow.role (canonical field in Peergent today). */
const EXACT_PEER_ROLE_TO_SERVICE: Record<string, HqServiceKey | null> = {
  Sales: "sales",
  Marketing: "marketing",
  Finance: "finance",
  Support: "support",
  Planning: "operations",
  Custom: null,
};

const MARKETING_KEYWORDS = [
  "marketing",
  "marketeer",
  "content",
  "ads",
  "ad ",
  "campaign",
  "social media",
];

const SALES_KEYWORDS = [
  "sales",
  "commercial",
  "commercieel",
  "acquisition",
  "lead generation",
  "lead gen",
  "sdr",
  "bdr",
];

const FINANCE_KEYWORDS = [
  "finance",
  "financial",
  "invoicing",
  "invoice",
  "bookkeeping",
  "accounting",
];

const SUPPORT_KEYWORDS = [
  "support",
  "customer service",
  "klantenservice",
  "service desk",
  "helpdesk",
  "help desk",
];

const OPERATIONS_KEYWORDS = [
  "planning",
  "planner",
  "operations",
  "operation",
  "scheduling",
  "schedule",
];

export type HqServicePeerLike = Pick<PeerRow, "role" | "name">;

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

function matchesKeyword(haystack: string, keyword: string): boolean {
  if (keyword.endsWith(" ")) {
    return haystack.includes(keyword);
  }
  const pattern = new RegExp(`(?:^|[\\s_-])${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[\\s_-])`);
  return pattern.test(` ${haystack} `) || haystack === keyword;
}

function matchesAny(haystack: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => matchesKeyword(haystack, keyword));
}

/**
 * Classifies a peer into an HQ service department.
 * Primary source: PeerRow.role exact match (Sales, Marketing, …).
 * Fallback: controlled keyword map on normalized role + name.
 */
export function getHqServiceKey(peer: HqServicePeerLike): HqServiceKey | null {
  const role = peer.role?.trim() ?? "";
  if (role && role in EXACT_PEER_ROLE_TO_SERVICE) {
    const mapped = EXACT_PEER_ROLE_TO_SERVICE[role];
    if (mapped) return mapped;
    if (role !== "Custom") return null;
  }

  const haystack = normalize(`${role} ${peer.name ?? ""}`);
  if (!haystack) return null;

  if (matchesAny(haystack, MARKETING_KEYWORDS)) return "marketing";
  if (matchesAny(haystack, SALES_KEYWORDS)) return "sales";
  if (matchesAny(haystack, FINANCE_KEYWORDS)) return "finance";
  if (matchesAny(haystack, SUPPORT_KEYWORDS)) return "support";
  if (matchesAny(haystack, OPERATIONS_KEYWORDS)) return "operations";

  return null;
}

export function sortServiceKeys(keys: HqServiceKey[]): HqServiceKey[] {
  return [...keys].sort(
    (left, right) =>
      HQ_SERVICE_DISPLAY_ORDER.indexOf(left) - HQ_SERVICE_DISPLAY_ORDER.indexOf(right)
  );
}
