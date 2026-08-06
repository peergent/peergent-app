import type {
  CampaignApprovalHistoryMap,
  CampaignApprovalMap,
} from "../campaign-approval/campaign-approval-types";
import type {
  CampaignPublicationState,
  CampaignRunState,
} from "./campaign-run-types";
import type { CampaignExecutionTimelineEvent } from "./campaign-execution-timeline";

export type DurableCampaignExecutionState = {
  readonly campaignApprovalByProjectId: CampaignApprovalMap;
  readonly campaignApprovalHistoryByProjectId: CampaignApprovalHistoryMap;
  readonly campaignRunByProjectId: Readonly<Record<string, CampaignRunState>>;
  readonly campaignPublicationByProjectId: Readonly<
    Record<string, CampaignPublicationState>
  >;
  readonly executionTimelineByProjectId: Readonly<
    Record<string, readonly CampaignExecutionTimelineEvent[]>
  >;
  readonly continuationResultsByKey: Readonly<
    Record<
      string,
      {
        readonly completedAt: string;
        readonly ok: boolean;
        readonly stopReason: string;
        readonly stopMessage: string;
        readonly iterations: number;
      }
    >
  >;
  readonly lastUpdated?: string;
};

const STORAGE_PREFIX = "peergent-durable-campaign:";

const memoryStore = new Map<string, DurableCampaignExecutionState>();

function emptyDurableState(): DurableCampaignExecutionState {
  return {
    campaignApprovalByProjectId: {},
    campaignApprovalHistoryByProjectId: {},
    campaignRunByProjectId: {},
    campaignPublicationByProjectId: {},
    executionTimelineByProjectId: {},
    continuationResultsByKey: {},
  };
}

export function loadDurableCampaignExecutionState(
  peerId: string
): DurableCampaignExecutionState {
  if (typeof window === "undefined") {
    return memoryStore.get(peerId) ?? emptyDurableState();
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${peerId}`);
    if (!raw) return emptyDurableState();
    const parsed = JSON.parse(raw) as DurableCampaignExecutionState;
    return {
      ...emptyDurableState(),
      ...parsed,
      campaignApprovalByProjectId: parsed.campaignApprovalByProjectId ?? {},
      campaignApprovalHistoryByProjectId:
        parsed.campaignApprovalHistoryByProjectId ?? {},
      campaignRunByProjectId: parsed.campaignRunByProjectId ?? {},
      campaignPublicationByProjectId: parsed.campaignPublicationByProjectId ?? {},
      executionTimelineByProjectId: parsed.executionTimelineByProjectId ?? {},
      continuationResultsByKey: parsed.continuationResultsByKey ?? {},
    };
  } catch {
    return emptyDurableState();
  }
}

export function saveDurableCampaignExecutionState(
  peerId: string,
  state: DurableCampaignExecutionState
): void {
  const next = { ...state, lastUpdated: new Date().toISOString() };
  if (typeof window === "undefined") {
    memoryStore.set(peerId, next);
    return;
  }
  localStorage.setItem(`${STORAGE_PREFIX}${peerId}`, JSON.stringify(next));
}

export function patchDurableCampaignExecutionState(
  peerId: string,
  patch: Partial<DurableCampaignExecutionState>
): DurableCampaignExecutionState {
  const stored = loadDurableCampaignExecutionState(peerId);
  const next: DurableCampaignExecutionState = {
    campaignApprovalByProjectId:
      patch.campaignApprovalByProjectId ?? stored.campaignApprovalByProjectId,
    campaignApprovalHistoryByProjectId:
      patch.campaignApprovalHistoryByProjectId ??
      stored.campaignApprovalHistoryByProjectId,
    campaignRunByProjectId:
      patch.campaignRunByProjectId ?? stored.campaignRunByProjectId,
    campaignPublicationByProjectId:
      patch.campaignPublicationByProjectId ?? stored.campaignPublicationByProjectId,
    executionTimelineByProjectId:
      patch.executionTimelineByProjectId ?? stored.executionTimelineByProjectId,
    continuationResultsByKey:
      patch.continuationResultsByKey ?? stored.continuationResultsByKey,
    lastUpdated: new Date().toISOString(),
  };
  saveDurableCampaignExecutionState(peerId, next);
  return next;
}

/** Test helper — reset in-memory durable store. */
export function resetDurableCampaignExecutionStateForTests(peerId?: string): void {
  if (peerId) {
    memoryStore.delete(peerId);
    return;
  }
  memoryStore.clear();
}

export function mergeDurableIntoWorkspaceState<T extends {
  campaignApprovalByProjectId?: CampaignApprovalMap;
  campaignApprovalHistoryByProjectId?: CampaignApprovalHistoryMap;
  projects?: readonly { id: string; campaignSetup?: Record<string, unknown> }[];
}>(
  peerId: string,
  workspace: T
): T {
  const durable = loadDurableCampaignExecutionState(peerId);
  const mergedProjects = (workspace.projects ?? []).map((project) => {
    const run = durable.campaignRunByProjectId[project.id];
    const publication = durable.campaignPublicationByProjectId[project.id];
    if (!run && !publication) return project;
    return {
      ...project,
      campaignSetup: {
        ...(project.campaignSetup ?? {}),
        ...(run ? { campaignRun: run } : {}),
        ...(publication ? { campaignPublication: publication } : {}),
      },
    };
  });

  return {
    ...workspace,
    campaignApprovalByProjectId: {
      ...workspace.campaignApprovalByProjectId,
      ...durable.campaignApprovalByProjectId,
    },
    campaignApprovalHistoryByProjectId: {
      ...workspace.campaignApprovalHistoryByProjectId,
      ...durable.campaignApprovalHistoryByProjectId,
    },
    projects: mergedProjects,
  } as T;
}
