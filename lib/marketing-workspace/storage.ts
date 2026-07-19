import type { MarketingWorkspacePersistedState } from "./types";

const STORAGE_PREFIX = "peergent-marketing-workspace:";

export function loadMarketingWorkspaceState(
  peerId: string
): MarketingWorkspacePersistedState {
  if (typeof window === "undefined") {
    return { drafts: [], activityFeed: [], conversation: [] };
  }

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${peerId}`);
    if (!raw) return { drafts: [], activityFeed: [], conversation: [] };
    const parsed = JSON.parse(raw) as MarketingWorkspacePersistedState;
    return {
      strategy: parsed.strategy,
      plan: parsed.plan,
      drafts: parsed.drafts ?? [],
      activityFeed: parsed.activityFeed ?? [],
      conversation: parsed.conversation ?? [],
      lastUpdated: parsed.lastUpdated,
    };
  } catch {
    return { drafts: [], activityFeed: [], conversation: [] };
  }
}

export function saveMarketingWorkspaceState(
  peerId: string,
  state: MarketingWorkspacePersistedState
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `${STORAGE_PREFIX}${peerId}`,
    JSON.stringify({ ...state, lastUpdated: new Date().toISOString() })
  );
}

export function upsertDraft(
  peerId: string,
  state: MarketingWorkspacePersistedState,
  draft: import("@/lib/marketing-intelligence").MarketingContentDraft
): MarketingWorkspacePersistedState {
  const existing = state.drafts.filter(
    (item) => item.planActivityReference !== draft.planActivityReference
  );
  const next = { ...state, drafts: [...existing, draft] };
  saveMarketingWorkspaceState(peerId, next);
  return next;
}
