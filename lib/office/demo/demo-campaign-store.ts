import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  createMarketingCampaignProject,
  type CreateMarketingCampaignProjectInput,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import { DEMO_PEER_ID } from "./demo-company";
import {
  clearPersistedDemoCampaignSnapshot,
  loadPersistedDemoCampaignSnapshot,
  persistDemoCampaignSnapshot,
} from "./demo-campaign-persistence";
import { DemoIsolationError } from "./demo-workspace-state";
import {
  simulateDemoCampaignWorkflow,
  unlockDemoDeliverables,
  type DemoCampaignSimulationBundle,
  type DemoStepApprovalStatus,
} from "./demo-workflow-simulation";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import { computeEndDateFromPreset } from "@/lib/office/campaign/campaign-duration";
import type {
  DemoCampaignActivityEvent,
  DemoCampaignPublished,
  DemoCampaignSchedule,
} from "./demo-campaign-domain-overlay";

export type DemoApprovalRecord = {
  draftId: string;
  action: "approved" | "changes_requested" | "rejected";
  by: string;
  at: string;
  notes?: string;
};

export type DemoCampaignSnapshot = {
  extraProjects: readonly MarketingProject[];
  extraDrafts: readonly MarketingContentDraft[];
  extraWorkUnits: readonly WorkUnit[];
  draftStatus: Readonly<Record<string, MarketingContentDraft["status"]>>;
  approvalHistory: readonly DemoApprovalRecord[];
  stepApprovals: Readonly<Record<string, Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>>>;
  deliverablesUnlocked: Readonly<Record<string, boolean>>;
  simulations: Readonly<Record<string, DemoCampaignSimulationBundle>>;
  campaignSchedule: Readonly<Record<string, DemoCampaignSchedule>>;
  campaignPublished: Readonly<Record<string, DemoCampaignPublished>>;
  campaignContexts: Readonly<Record<string, CampaignContext>>;
  activityEvents: readonly DemoCampaignActivityEvent[];
};

const emptySnapshot: DemoCampaignSnapshot = {
  extraProjects: [],
  extraDrafts: [],
  extraWorkUnits: [],
  draftStatus: {},
  approvalHistory: [],
  stepApprovals: {},
  deliverablesUnlocked: {},
  simulations: {},
  campaignSchedule: {},
  campaignPublished: {},
  campaignContexts: {},
  activityEvents: [],
};

let snapshot: DemoCampaignSnapshot = emptySnapshot;
let hydrated = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function ensureHydrated(): void {
  if (hydrated || typeof window === "undefined") return;
  const loaded = loadPersistedDemoCampaignSnapshot();
  if (loaded) snapshot = loaded;
  hydrated = true;
}

function emit(): void {
  persistDemoCampaignSnapshot(snapshot);
  for (const listener of listeners) listener();
}

function assertDemoPeer(peerId: string): void {
  if (peerId !== DEMO_PEER_ID) throw new DemoIsolationError(peerId);
}

function draftIdsForProject(projectId: string): string[] {
  return snapshot.extraDrafts
    .filter((d) =>
      snapshot.extraWorkUnits.some((u) => u.draftId === d.id && u.projectId === projectId)
    )
    .map((d) => d.id);
}

function resolveDraftStatus(draftId: string): MarketingContentDraft["status"] | undefined {
  const override = snapshot.draftStatus[draftId];
  if (override) return override;
  return snapshot.extraDrafts.find((d) => d.id === draftId)?.status;
}

function pendingDraftIdsForProject(projectId: string): string[] {
  return draftIdsForProject(projectId).filter((id) => resolveDraftStatus(id) === "ready_for_review");
}

function approvedDraftIdsForProject(projectId: string): string[] {
  return draftIdsForProject(projectId).filter((id) => resolveDraftStatus(id) === "approved");
}

function stepApprovalActivityTitle(stepId: CampaignWorkflowStepId, nl: boolean): string {
  const map: Partial<Record<CampaignWorkflowStepId, { nl: string; en: string }>> = {
    business_analyzed: { nl: "Bedrijfscontext bevestigd", en: "Business context confirmed" },
    website_analyzed: { nl: "Website bekeken", en: "Website reviewed" },
    competitors_analyzed: { nl: "Markt en concurrenten bekeken", en: "Market and competitors reviewed" },
    strategy_determined: { nl: "Strategie opgesteld", en: "Strategy prepared" },
    channels_selected: { nl: "Kanalen gekozen", en: "Channels selected" },
    deliverables_created: { nl: "Campagneonderdelen gemaakt", en: "Campaign deliverables created" },
    waiting_for_approval: { nl: "Klaar voor jouw goedkeuring", en: "Ready for your approval" },
    scheduled: { nl: "Campagne ingepland", en: "Campaign scheduled" },
    published: { nl: "Campagne gepubliceerd", en: "Campaign published" },
  };
  const entry = map[stepId];
  return entry ? (nl ? entry.nl : entry.en) : stepId;
}

function appendActivity(event: Omit<DemoCampaignActivityEvent, "id">): void {
  snapshot = {
    ...snapshot,
    activityEvents: [
      ...snapshot.activityEvents,
      { ...event, id: `${event.kind}-${event.projectId}-${event.at}` },
    ],
  };
}

export function subscribeDemoCampaignStore(listener: Listener): () => void {
  ensureHydrated();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoCampaignSnapshot(): DemoCampaignSnapshot {
  ensureHydrated();
  return snapshot;
}

export function getDemoCampaignSnapshotServer(): DemoCampaignSnapshot {
  return emptySnapshot;
}

export function resetDemoCampaignStore(): void {
  if (
    snapshot.extraProjects.length === 0 &&
    snapshot.extraDrafts.length === 0 &&
    Object.keys(snapshot.draftStatus).length === 0 &&
    snapshot.approvalHistory.length === 0 &&
    Object.keys(snapshot.stepApprovals).length === 0 &&
    Object.keys(snapshot.campaignSchedule).length === 0 &&
    Object.keys(snapshot.campaignPublished).length === 0 &&
    snapshot.activityEvents.length === 0
  ) {
    clearPersistedDemoCampaignSnapshot();
    return;
  }
  snapshot = emptySnapshot;
  clearPersistedDemoCampaignSnapshot();
  emit();
}

export function isDemoCampaignStoreModified(): boolean {
  ensureHydrated();
  return (
    snapshot.extraProjects.length > 0 ||
    snapshot.extraDrafts.length > 0 ||
    Object.keys(snapshot.draftStatus).length > 0 ||
    snapshot.approvalHistory.length > 0 ||
    Object.keys(snapshot.stepApprovals).length > 0 ||
    Object.keys(snapshot.campaignSchedule).length > 0 ||
    Object.keys(snapshot.campaignPublished).length > 0 ||
    snapshot.activityEvents.length > 0
  );
}

export function isDemoCampaignScheduled(projectId: string): boolean {
  return Boolean(snapshot.campaignSchedule[projectId]);
}

export function isDemoCampaignPublished(projectId: string): boolean {
  return Boolean(snapshot.campaignPublished[projectId]);
}

export function canScheduleDemoCampaign(peerId: string, projectId: string): boolean {
  assertDemoPeer(peerId);
  if (isDemoCampaignScheduled(projectId)) return false;
  const draftIds = draftIdsForProject(projectId);
  if (draftIds.length === 0) return false;
  if (pendingDraftIdsForProject(projectId).length > 0) return false;
  return draftIds.every((id) => resolveDraftStatus(id) === "approved");
}

export function canPublishDemoCampaign(peerId: string, projectId: string): boolean {
  assertDemoPeer(peerId);
  if (!isDemoCampaignScheduled(projectId)) return false;
  if (isDemoCampaignPublished(projectId)) return false;
  if (pendingDraftIdsForProject(projectId).length > 0) return false;
  const draftIds = draftIdsForProject(projectId);
  return draftIds.some((id) => {
    const status = resolveDraftStatus(id);
    return status === "ready_to_publish";
  });
}

export function createDemoCampaign(
  peerId: string,
  input: CreateMarketingCampaignProjectInput,
  locale: "nl" | "en" = "nl"
): MarketingProject {
  assertDemoPeer(peerId);
  const project = createMarketingCampaignProject({ ...input, peerId: DEMO_PEER_ID });
  const simulation = simulateDemoCampaignWorkflow(project, input, locale);

  snapshot = {
    ...snapshot,
    extraProjects: [...snapshot.extraProjects, project],
    extraDrafts: [...snapshot.extraDrafts, ...simulation.drafts],
    extraWorkUnits: [...snapshot.extraWorkUnits, ...simulation.workUnits],
    stepApprovals: {
      ...snapshot.stepApprovals,
      [project.id]: simulation.stepApprovals,
    },
    deliverablesUnlocked: {
      ...snapshot.deliverablesUnlocked,
      [project.id]: simulation.deliverablesUnlocked,
    },
    simulations: {
      ...snapshot.simulations,
      [project.id]: simulation,
    },
    campaignContexts: {
      ...snapshot.campaignContexts,
      [project.id]: simulation.campaignContext,
    },
  };
  appendActivity({
    projectId: project.id,
    kind: "step_approved",
    title: locale === "nl" ? "Campagne gestart" : "Campaign started",
    description:
      locale === "nl"
        ? `Ik ga "${project.title}" voor je opbouwen.`
        : `I'm building "${project.title}" for you.`,
    at: new Date().toISOString(),
  });
  emit();
  return project;
}

export function setDemoStepApproval(
  peerId: string,
  projectId: string,
  stepId: CampaignWorkflowStepId,
  status: DemoStepApprovalStatus
): void {
  assertDemoPeer(peerId);
  const prev = snapshot.stepApprovals[projectId] ?? {};
  snapshot = {
    ...snapshot,
    stepApprovals: {
      ...snapshot.stepApprovals,
      [projectId]: { ...prev, [stepId]: status },
    },
  };

  if (stepId === "channels_selected" && status === "approved") {
    const sim = snapshot.simulations[projectId];
    if (sim && !snapshot.deliverablesUnlocked[projectId]) {
      const { drafts, workUnits } = unlockDemoDeliverables(sim.drafts, sim.workUnits);
      const unlockedDrafts = drafts.map((d) => {
        const override = snapshot.draftStatus[d.id];
        return override ? { ...d, status: override } : d;
      });
      snapshot = {
        ...snapshot,
        deliverablesUnlocked: { ...snapshot.deliverablesUnlocked, [projectId]: true },
        simulations: {
          ...snapshot.simulations,
          [projectId]: { ...sim, drafts, workUnits, deliverablesUnlocked: true },
        },
        extraDrafts: [
          ...snapshot.extraDrafts.filter((d) => !sim.drafts.some((sd) => sd.id === d.id)),
          ...unlockedDrafts,
        ],
        extraWorkUnits: snapshot.extraWorkUnits.map((u) =>
          u.projectId === projectId ? (workUnits.find((wu) => wu.id === u.id) ?? u) : u
        ),
      };
    }
  }

  if (status === "approved") {
    const nl = true;
    appendActivity({
      projectId,
      kind: "step_approved",
      title: nl
        ? `Jij keurde goed: ${stepApprovalActivityTitle(stepId, true)}`
        : `You approved: ${stepApprovalActivityTitle(stepId, false)}`,
      description: stepApprovalActivityTitle(stepId, nl),
      at: new Date().toISOString(),
    });
  }

  emit();
}

export function setDemoDraftStatus(
  peerId: string,
  draftId: string,
  status: MarketingContentDraft["status"],
  record?: Omit<DemoApprovalRecord, "draftId" | "at"> & { at?: string }
): void {
  assertDemoPeer(peerId);
  snapshot = {
    ...snapshot,
    draftStatus: { ...snapshot.draftStatus, [draftId]: status },
    approvalHistory: record
      ? [
          ...snapshot.approvalHistory,
          {
            draftId,
            action: record.action,
            by: record.by,
            at: record.at ?? new Date().toISOString(),
            notes: record.notes,
          },
        ]
      : snapshot.approvalHistory,
  };
  emit();
}

export function approveAllDemoDrafts(
  peerId: string,
  draftIds: readonly string[],
  by: string
): void {
  assertDemoPeer(peerId);
  const nextStatus = { ...snapshot.draftStatus };
  const nextHistory = [...snapshot.approvalHistory];
  const at = new Date().toISOString();
  for (const draftId of draftIds) {
    nextStatus[draftId] = "approved";
    nextHistory.push({ draftId, action: "approved", by, at });
  }
  snapshot = {
    ...snapshot,
    draftStatus: nextStatus,
    approvalHistory: nextHistory,
  };
  emit();
}

export function scheduleDemoCampaign(
  peerId: string,
  projectId: string,
  scheduledAt?: string
): boolean {
  assertDemoPeer(peerId);
  if (!canScheduleDemoCampaign(peerId, projectId)) return false;

  const draftIds = approvedDraftIdsForProject(projectId);
  const channels = [
    ...new Set(
      snapshot.extraDrafts
        .filter((d) => draftIds.includes(d.id))
        .map((d) => d.channel)
        .filter(Boolean) as string[]
    ),
  ];

  const at = scheduledAt ?? new Date().toISOString();
  const nextStatus = { ...snapshot.draftStatus };
  for (const id of draftIds) {
    nextStatus[id] = "ready_to_publish";
  }

  snapshot = {
    ...snapshot,
    draftStatus: nextStatus,
    campaignSchedule: {
      ...snapshot.campaignSchedule,
      [projectId]: {
        scheduledAt: at,
        channels,
        deliverableIds: draftIds,
      },
    },
    stepApprovals: {
      ...snapshot.stepApprovals,
      [projectId]: {
        ...(snapshot.stepApprovals[projectId] ?? {}),
        waiting_for_approval: "approved",
        deliverables_created: "approved",
        scheduled: "approved",
      },
    },
  };

  appendActivity({
    projectId,
    kind: "scheduled",
    title: "Campagne ingepland",
    description: `${draftIds.length} deliverables scheduled across ${channels.join(", ")}`,
    at: at,
  });

  emit();
  return true;
}

export function publishDemoCampaign(peerId: string, projectId: string): boolean {
  assertDemoPeer(peerId);
  if (!canPublishDemoCampaign(peerId, projectId)) return false;

  const draftIds = draftIdsForProject(projectId);
  const nextStatus = { ...snapshot.draftStatus };
  for (const id of draftIds) {
    const current = resolveDraftStatus(id);
    if (current === "ready_to_publish") {
      nextStatus[id] = "published";
    }
  }

  const publishedAt = new Date().toISOString();
  const runningStart = publishedAt.slice(0, 10);
  const existingCtx = snapshot.campaignContexts[projectId];
  const updatedContext = existingCtx
    ? {
        ...existingCtx,
        startDate: runningStart,
        endDate:
          existingCtx.durationPreset === "ongoing"
            ? null
            : computeEndDateFromPreset(new Date(runningStart), existingCtx.durationPreset),
      }
    : undefined;

  snapshot = {
    ...snapshot,
    draftStatus: nextStatus,
    campaignPublished: {
      ...snapshot.campaignPublished,
      [projectId]: { publishedAt },
    },
    stepApprovals: {
      ...snapshot.stepApprovals,
      [projectId]: {
        ...(snapshot.stepApprovals[projectId] ?? {}),
        published: "approved",
      },
    },
    ...(updatedContext
      ? {
          campaignContexts: {
            ...snapshot.campaignContexts,
            [projectId]: updatedContext,
          },
        }
      : {}),
  };

  appendActivity({
    projectId,
    kind: "published",
    title: "Campagne gepubliceerd",
    description: `${draftIds.filter((id) => nextStatus[id] === "published").length} deliverables live`,
    at: publishedAt,
  });

  emit();
  return true;
}

export function getDemoCampaignContext(projectId: string): CampaignContext | undefined {
  return snapshot.campaignContexts[projectId];
}

export function skipDemoWebsiteAnalysis(peerId: string, projectId: string): void {
  assertDemoPeer(peerId);
  const ctx = snapshot.campaignContexts[projectId];
  if (!ctx) return;
  snapshot = {
    ...snapshot,
    campaignContexts: {
      ...snapshot.campaignContexts,
      [projectId]: { ...ctx, websiteState: "skipped", websiteUrl: null, websiteSource: "skipped" },
    },
    stepApprovals: {
      ...snapshot.stepApprovals,
      [projectId]: {
        ...(snapshot.stepApprovals[projectId] ?? {}),
        website_analyzed: "approved",
      },
    },
  };
  appendActivity({
    projectId,
    kind: "step_approved",
    title: "Website-analyse overgeslagen",
    description: "Website-analyse overgeslagen op jouw verzoek.",
    at: new Date().toISOString(),
  });
  emit();
}

export function addDemoWebsiteUrl(peerId: string, projectId: string, url: string): void {
  assertDemoPeer(peerId);
  const ctx = snapshot.campaignContexts[projectId];
  if (!ctx) return;
  const trimmed = url.trim();
  snapshot = {
    ...snapshot,
    campaignContexts: {
      ...snapshot.campaignContexts,
      [projectId]: {
        ...ctx,
        websiteUrl: trimmed,
        websiteSource: "supplied_by_customer",
        websiteState: "simulated_analysis_complete",
      },
    },
    stepApprovals: {
      ...snapshot.stepApprovals,
      [projectId]: {
        ...(snapshot.stepApprovals[projectId] ?? {}),
        website_analyzed: "approved",
      },
    },
  };
  appendActivity({
    projectId,
    kind: "step_approved",
    title: "Websitecontext verwerkt",
    description: `Emma heeft ${trimmed} als websitecontext gebruikt (simulatie, geen crawl).`,
    at: new Date().toISOString(),
  });
  emit();
}

export function skipDemoCompetitorAnalysis(peerId: string, projectId: string): void {
  assertDemoPeer(peerId);
  const ctx = snapshot.campaignContexts[projectId];
  if (!ctx) return;
  snapshot = {
    ...snapshot,
    campaignContexts: {
      ...snapshot.campaignContexts,
      [projectId]: {
        ...ctx,
        competitors: [],
        competitorsSkipped: true,
        competitorContextState: "skipped",
      },
    },
    stepApprovals: {
      ...snapshot.stepApprovals,
      [projectId]: {
        ...(snapshot.stepApprovals[projectId] ?? {}),
        competitors_analyzed: "approved",
      },
    },
  };
  appendActivity({
    projectId,
    kind: "step_approved",
    title: "Concurrentieanalyse overgeslagen",
    description: "Concurrentieanalyse overgeslagen op jouw verzoek.",
    at: new Date().toISOString(),
  });
  emit();
}

export type DemoCompetitorInput = { name: string; url?: string };

export function addDemoCompetitors(
  peerId: string,
  projectId: string,
  competitors: readonly DemoCompetitorInput[]
): void {
  assertDemoPeer(peerId);
  const ctx = snapshot.campaignContexts[projectId];
  if (!ctx) return;
  const entries = competitors
    .map((c) => ({ name: c.name.trim(), url: c.url?.trim() || undefined }))
    .filter((c) => c.name.length > 0);
  if (entries.length === 0) return;
  snapshot = {
    ...snapshot,
    campaignContexts: {
      ...snapshot.campaignContexts,
      [projectId]: {
        ...ctx,
        competitors: entries,
        competitorsSkipped: false,
        competitorContextState: "simulated_analysis_complete",
      },
    },
    stepApprovals: {
      ...snapshot.stepApprovals,
      [projectId]: {
        ...(snapshot.stepApprovals[projectId] ?? {}),
        competitors_analyzed: "approved",
      },
    },
  };
  appendActivity({
    projectId,
    kind: "step_approved",
    title: "Concurrenten toegevoegd",
    description: `Emma vergelijkt met: ${entries.map((e) => e.name).join(", ")}.`,
    at: new Date().toISOString(),
  });
  emit();
}

export function getDemoStepApprovals(
  projectId: string
): Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>> {
  return snapshot.stepApprovals[projectId] ?? {};
}

/** Test-only: replace in-memory snapshot without persistence side effects. */
export function __setDemoCampaignSnapshotForTests(next: DemoCampaignSnapshot): void {
  snapshot = next;
  hydrated = true;
}
