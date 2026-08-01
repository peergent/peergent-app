import {
  deriveProjectStatus,
  projectStatusLabel,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import { officeHref } from "../links";
import { resolveProjectIdForDraft } from "../attribution";

export type CampaignWorkspaceItemKind = "completed" | "pending" | "preview";

export type CampaignWorkspaceItem = {
  id: string;
  kind: CampaignWorkspaceItemKind;
  label: string;
  description?: string;
  draftId?: string;
  channel?: string;
  reviewHref?: string;
  previewHref?: string;
  detailHref?: string;
  evidence?: string;
  actionable: boolean;
};

export type CampaignDetailTimelineStep = {
  id: string;
  label: string;
  state: "done" | "active" | "upcoming";
};

export type CampaignDetailViewModel = {
  peerId: string;
  projectId: string;
  name: string;
  statusLabel: string;
  goal: string;
  why: string;
  channels: string[];
  ownerLabel: string;
  createdAtLabel: string;
  detailHref: string;
  completed: CampaignWorkspaceItem[];
  pending: CampaignWorkspaceItem[];
  previews: CampaignWorkspaceItem[];
  timeline: CampaignDetailTimelineStep[];
  producedDrafts: MarketingContentDraft[];
};

function channelLabel(channel: string, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    instagram: { en: "Instagram", nl: "Instagram" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    email: { en: "Email", nl: "E-mail" },
    blog: { en: "Blog", nl: "Blog" },
    website_landing: { en: "Landing page", nl: "Landingspagina" },
  };
  return map[channel]?.[nl ? "nl" : "en"] ?? channel;
}

function projectDrafts(
  projectId: string,
  domainInput: MarketingPeerDomainInput
): MarketingContentDraft[] {
  return domainInput.drafts.filter(
    (draft) => resolveProjectIdForDraft(draft, domainInput.workUnits) === projectId
  );
}

function buildTimeline(
  status: ReturnType<typeof deriveProjectStatus>,
  nl: boolean
): CampaignDetailTimelineStep[] {
  const steps: { id: string; en: string; nl: string }[] = [
    { id: "research", en: "Research", nl: "Onderzoek" },
    { id: "strategy", en: "Strategy", nl: "Strategie" },
    { id: "production", en: "Content production", nl: "Contentproductie" },
    { id: "review", en: "Review", nl: "Review" },
    { id: "scheduled", en: "Scheduled", nl: "Ingepland" },
    { id: "published", en: "Published", nl: "Gepubliceerd" },
    { id: "measurement", en: "Measurement", nl: "Meting" },
  ];

  const order = ["planning", "preparing", "waiting_for_review", "scheduled", "publishing", "monitoring_results", "completed"];
  const idx = order.indexOf(status);

  return steps.map((step, index) => {
    let state: CampaignDetailTimelineStep["state"] = "upcoming";
    if (idx >= 5 && index <= 5) state = "done";
    else if (idx >= 3 && index <= 4) state = index <= 3 ? "done" : "active";
    else if (idx >= 1 && index <= 2) state = index <= 1 ? "done" : "active";
    else if (idx >= 0 && index === 0) state = "done";
    if (status === "waiting_for_review" && step.id === "review") state = "active";
    if (status === "preparing" && step.id === "production") state = "active";
    return { id: step.id, label: nl ? step.nl : step.en, state };
  });
}

export function buildCampaignDetailViewModel(input: {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
}): CampaignDetailViewModel | null {
  const { peerId, projectId, domainInput } = input;
  const nl = input.locale === "nl";
  const project = domainInput.projects.find((p) => p.id === projectId);
  if (!project) return null;

  const drafts = projectDrafts(projectId, domainInput);
  const status = deriveProjectStatus(
    project,
    domainInput.workUnits,
    domainInput.drafts,
    new Set()
  );

  const channels = [
    ...new Set(
      drafts.map((d) => d.channel).filter(Boolean) as string[]
    ),
  ].map((c) => channelLabel(c, nl));

  const completed: CampaignWorkspaceItem[] = [];
  const pending: CampaignWorkspaceItem[] = [];
  const previews: CampaignWorkspaceItem[] = [];
  const seenPreviewChannels = new Set<string>();

  for (const draft of drafts) {
    const label = draft.title || channelLabel(draft.channel ?? "content", nl);
    const previewHref = `${officeHref(peerId, "content")}?preview=${draft.id}`;
    const detailHref = `/office/${peerId}/content/${draft.id}`;

    if (draft.status === "published" || draft.status === "approved") {
      completed.push({
        id: draft.id,
        kind: "completed",
        label,
        description: draft.objective,
        draftId: draft.id,
        channel: draft.channel ?? undefined,
        previewHref,
        detailHref,
        evidence: draft.body?.slice(0, 240),
        actionable: Boolean(draft.body),
      });
    }

    if (draft.status === "ready_for_review") {
      pending.push({
        id: draft.id,
        kind: "pending",
        label,
        description: nl ? "Wacht op jouw goedkeuring" : "Waiting for your approval",
        draftId: draft.id,
        channel: draft.channel ?? undefined,
        previewHref,
        detailHref,
        reviewHref: previewHref,
        actionable: true,
      });
    }

    const channel = draft.channel ?? "content";
    if (!seenPreviewChannels.has(channel)) {
      seenPreviewChannels.add(channel);
      previews.push({
        id: `preview-${channel}`,
        kind: "preview",
        label: channelLabel(channel, nl),
        draftId: draft.id,
        channel,
        previewHref,
        actionable: true,
      });
    }
  }

  if (pending.length === 0 && status === "waiting_for_review") {
    pending.push({
      id: "pending-review",
      kind: "pending",
      label: nl ? "Goedkeuring headline" : "Headline approval",
      description: nl ? "Er staat content klaar voor review." : "Content is ready for review.",
      actionable: drafts.some((d) => d.status === "ready_for_review"),
      previewHref: drafts.find((d) => d.status === "ready_for_review")
        ? `${officeHref(peerId, "content")}?preview=${drafts.find((d) => d.status === "ready_for_review")!.id}`
        : undefined,
    });
  }

  return {
    peerId,
    projectId,
    name: project.title,
    statusLabel: projectStatusLabel(status),
    goal: project.goal ?? "",
    why: project.rawRequest ?? "",
    channels,
    ownerLabel: project.ownerLabel ?? "",
    createdAtLabel: project.createdAt,
    detailHref: `${officeHref(peerId, "work")}/campaigns/${projectId}`,
    completed,
    pending,
    previews,
    timeline: buildTimeline(status, nl),
    producedDrafts: drafts,
  };
}

export function findCampaignProject(
  domainInput: MarketingPeerDomainInput,
  projectId: string
): MarketingProject | null {
  return domainInput.projects.find((p) => p.id === projectId) ?? null;
}
