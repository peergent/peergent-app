import type { MarketingWorkspacePersistedState } from "./types";
import type { ActivityFeedItem } from "./experience/types";
import { syncActivityFeedWithUnderstanding } from "./experience/activity-feed";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { migrateWorkspaceProjects } from "@/lib/peer-experience/marketing/projects/migrate-projects";
import {
  ensureResponsibilityCatalog,
  migrateWorkspaceResponsibilities,
} from "@/lib/peer-experience/marketing/responsibilities/migrate-responsibilities";
import { mergeDurableIntoWorkspaceState } from "@/lib/peer-experience/marketing/campaign-execution/durable-campaign-state-store";

const STORAGE_PREFIX = "peergent-marketing-workspace:";

function normalizeStoredState(
  peerId: string,
  parsed: MarketingWorkspacePersistedState
): MarketingWorkspacePersistedState {
  const base: MarketingWorkspacePersistedState = {
    strategy: parsed.strategy,
    creativeBriefByCampaignId: parsed.creativeBriefByCampaignId ?? {},
    linkedinPostByWorkUnitId: parsed.linkedinPostByWorkUnitId ?? {},
    emailByWorkUnitId: parsed.emailByWorkUnitId ?? {},
    plan: parsed.plan,
    drafts: parsed.drafts ?? [],
    publicationPackages: parsed.publicationPackages ?? [],
    activityFeed: parsed.activityFeed ?? [],
    conversation: parsed.conversation ?? [],
    workUnits: parsed.workUnits ?? [],
    projects: parsed.projects ?? [],
    responsibilities: parsed.responsibilities ?? [],
    automations: parsed.automations ?? [],
    insightRotation: parsed.insightRotation ?? {
      dismissedIds: [],
      lastIndex: -1,
      lastRotatedAt: new Date(0).toISOString(),
    },
    metrics: parsed.metrics ?? [],
    approvalOverlays: parsed.approvalOverlays ?? {},
    campaignReviewDecisionByWorkUnitId:
      parsed.campaignReviewDecisionByWorkUnitId ?? {},
    campaignReviewDecisionHistoryByWorkUnitId:
      parsed.campaignReviewDecisionHistoryByWorkUnitId ?? {},
    campaignArtifactVersionByWorkUnitId:
      parsed.campaignArtifactVersionByWorkUnitId ?? {},
    campaignApprovalByProjectId: parsed.campaignApprovalByProjectId ?? {},
    campaignApprovalHistoryByProjectId: parsed.campaignApprovalHistoryByProjectId ?? {},
    lastUpdated: parsed.lastUpdated,
  };

  const migrated = migrateWorkspaceProjects(base);
  const respSeed = migrateWorkspaceResponsibilities({
    peerId,
    responsibilities: parsed.responsibilities,
  });
  return {
    ...base,
    projects: migrated.projects,
    workUnits: migrated.workUnits,
    responsibilities: ensureResponsibilityCatalog(peerId, respSeed.responsibilities),
  };
}

export function loadMarketingWorkspaceState(
  peerId: string
): MarketingWorkspacePersistedState {
  if (typeof window === "undefined") {
    return {
      drafts: [],
      publicationPackages: [],
      activityFeed: [],
      conversation: [],
      workUnits: [],
      projects: [],
      responsibilities: [],
      automations: [],
      insightRotation: { dismissedIds: [], lastIndex: -1, lastRotatedAt: new Date(0).toISOString() },
      metrics: [],
      approvalOverlays: {},
    };
  }

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${peerId}`);
    if (!raw) {
      return normalizeStoredState(peerId, {
        drafts: [],
        publicationPackages: [],
        activityFeed: [],
        conversation: [],
        workUnits: [],
        projects: [],
        responsibilities: [],
        automations: [],
        metrics: [],
        approvalOverlays: {},
      });
    }
    const parsed = JSON.parse(raw) as MarketingWorkspacePersistedState;
    const normalized = normalizeStoredState(peerId, parsed);
    return mergeDurableIntoWorkspaceState(peerId, normalized);
  } catch {
    return {
      drafts: [],
      publicationPackages: [],
      activityFeed: [],
      conversation: [],
      workUnits: [],
      projects: [],
      responsibilities: [],
      automations: [],
      insightRotation: { dismissedIds: [], lastIndex: -1, lastRotatedAt: new Date(0).toISOString() },
      metrics: [],
      approvalOverlays: {},
    };
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

/** Merge a partial update with the latest persisted snapshot — avoids stale React closure overwrites. */
export function patchMarketingWorkspaceState(
  peerId: string,
  patch: Partial<MarketingWorkspacePersistedState>
): MarketingWorkspacePersistedState {
  const stored = loadMarketingWorkspaceState(peerId);
  const next: MarketingWorkspacePersistedState = {
    ...stored,
    ...patch,
    strategy: patch.strategy !== undefined ? patch.strategy : stored.strategy,
    plan: patch.plan !== undefined ? patch.plan : stored.plan,
    creativeBriefByCampaignId:
      patch.creativeBriefByCampaignId ?? stored.creativeBriefByCampaignId ?? {},
    linkedinPostByWorkUnitId:
      patch.linkedinPostByWorkUnitId ?? stored.linkedinPostByWorkUnitId ?? {},
    emailByWorkUnitId: patch.emailByWorkUnitId ?? stored.emailByWorkUnitId ?? {},
    drafts: patch.drafts ?? stored.drafts,
    publicationPackages: patch.publicationPackages ?? stored.publicationPackages,
    activityFeed: patch.activityFeed ?? stored.activityFeed,
    conversation: patch.conversation ?? stored.conversation,
    workUnits: patch.workUnits ?? stored.workUnits ?? [],
    projects: patch.projects ?? stored.projects ?? [],
    responsibilities: patch.responsibilities ?? stored.responsibilities ?? [],
    automations: patch.automations ?? stored.automations ?? [],
    insightRotation: patch.insightRotation ?? stored.insightRotation,
    metrics: patch.metrics ?? stored.metrics ?? [],
    approvalOverlays: patch.approvalOverlays ?? stored.approvalOverlays ?? {},
    campaignReviewDecisionByWorkUnitId:
      patch.campaignReviewDecisionByWorkUnitId ??
      stored.campaignReviewDecisionByWorkUnitId ??
      {},
    campaignReviewDecisionHistoryByWorkUnitId:
      patch.campaignReviewDecisionHistoryByWorkUnitId ??
      stored.campaignReviewDecisionHistoryByWorkUnitId ??
      {},
    campaignArtifactVersionByWorkUnitId:
      patch.campaignArtifactVersionByWorkUnitId ??
      stored.campaignArtifactVersionByWorkUnitId ??
      {},
    campaignApprovalByProjectId:
      patch.campaignApprovalByProjectId ??
      stored.campaignApprovalByProjectId ??
      {},
    campaignApprovalHistoryByProjectId:
      patch.campaignApprovalHistoryByProjectId ??
      stored.campaignApprovalHistoryByProjectId ??
      {},
  };
  saveMarketingWorkspaceState(peerId, next);
  return next;
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

/** Persist activity feed without reading React state — safe for load/reload callbacks. */
export function persistWorkspaceActivityFeed(
  peerId: string,
  activityFeed: ActivityFeedItem[]
): void {
  const stored = loadMarketingWorkspaceState(peerId);
  saveMarketingWorkspaceState(peerId, {
    ...stored,
    activityFeed,
  });
}

export function applyUnderstandingToWorkspace(
  peerId: string,
  understanding: MarketingUnderstanding,
  baseFeed?: ActivityFeedItem[]
): ActivityFeedItem[] {
  const stored = loadMarketingWorkspaceState(peerId);
  const nextFeed = syncActivityFeedWithUnderstanding(
    baseFeed ?? stored.activityFeed ?? [],
    understanding
  );
  persistWorkspaceActivityFeed(peerId, nextFeed);
  return nextFeed;
}
