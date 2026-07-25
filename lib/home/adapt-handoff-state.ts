import { gapToKnowledgeSection, knowledgeSectionHref } from "@/lib/knowledge";
import { formatGapLabel } from "@/lib/marketing-workspace/experience/activity-feed";
import { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import { getHomeCopy } from "@/lib/i18n";
import type {
  AdaptHandoffInput,
  HandoffPrimaryWork,
  HandoffScene,
  HandoffSecondaryItem,
  HandoffState,
  HandoffUrgency,
} from "./handoff-types";
import { enrichHandoffVisual } from "./handoff-visual";
import { getTimeGreeting, marketingWorkspaceHref } from "./load-home-data";
import type { HomeNeedsYouItem, HomePeerWorkspaceSnapshot } from "./types";

type RawHandoffState = Omit<
  HandoffState,
  "personalGreeting" | "headline" | "categoryLabel" | "secondaryPriorities" | "teamWorkingVisible"
> &
  Partial<
    Pick<
      HandoffState,
      "personalGreeting" | "headline" | "categoryLabel" | "secondaryPriorities" | "teamWorkingVisible"
    >
  >;

function finalizeHandoffState(raw: RawHandoffState, firstName?: string): HandoffState {
  return enrichHandoffVisual(
    {
      personalGreeting: "",
      headline: "",
      categoryLabel: "",
      secondaryPriorities: [],
      teamWorkingVisible: raw.companyActivity.activeCount > 0,
      ...raw,
    },
    firstName
  );
}

function formatCompletedLabel(iso: string | undefined | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function greetingFor(firstName: string | undefined): string {
  const base = getTimeGreeting();
  if (!firstName?.trim()) return `${base}.`;
  return `${base}, ${firstName.trim()}.`;
}

function secondaryFromNeedsYou(items: HomeNeedsYouItem[]): HandoffSecondaryItem[] {
  return items.slice(1, 3).map((item) => ({
    id: item.id,
    label: item.subtitle ? `${item.subtitle}` : item.title,
    destination: item.href,
  }));
}

function companyActivityFrom(
  teamPulse: AdaptHandoffInput["viewModel"]["teamPulse"]
): HandoffState["companyActivity"] {
  const working = teamPulse.filter(
    (item) => item.statusKind === "working" || item.statusKind === "waiting"
  ).length;
  const activeCount = Math.max(working, teamPulse.filter((p) => p.statusKind !== "paused").length);
  const intensity =
    working >= 2 ? "high" : working === 1 ? "medium" : activeCount > 0 ? "low" : "low";
  return { activeCount, intensity };
}

function primaryFromNeedsYou(top: HomeNeedsYouItem, copy: ReturnType<typeof getHomeCopy>): {
  work: HandoffPrimaryWork;
  scene: HandoffScene;
  urgency: HandoffUrgency;
  briefingLines: string[];
  waitLine?: string;
} {
  const isUrgent = top.priority === "urgent";
  const title =
    top.subtitle && top.subtitle !== top.peerName ? top.subtitle : top.title.replace(/^Review /i, "");

  const work: HandoffPrimaryWork = {
    id: top.id,
    title,
    peerName: top.peerName,
    peerId: top.peerId,
    completedAt: top.timestamp ?? null,
    completedAtLabel: formatCompletedLabel(top.timestamp),
    contextLine: isUrgent ? "Waiting for your review" : undefined,
    destination: top.href,
    kind: top.href.includes("/company") || top.href.includes("/knowledge") ? "context" : top.title.includes("Publication") ? "publication" : "draft",
  };

  if (top.title === copy.needsYouItems.confirmPublication) {
    return {
      work,
      scene: "urgent",
      urgency: "urgent",
      briefingLines: ["This needs you before we can publish."],
    };
  }

  if (top.title === copy.needsYouItems.reviewDraft) {
    return {
      work: { ...work, contextLine: "Ready for your review" },
      scene: "completed",
      urgency: "normal",
      briefingLines: [
        `I finished ${title.endsWith(".") ? title : `your ${title.toLowerCase()}.`}`,
      ],
    };
  }

  if (top.title === copy.needsYouItems.improveContext) {
    return {
      work: {
        ...work,
        kind: "context",
        title: "Company context",
        contextLine: "Needed to continue",
      },
      scene: "blocked",
      urgency: "blocked",
      briefingLines: ["I can't move forward without more company context."],
    };
  }

  return {
    work,
    scene: "completed",
    urgency: "normal",
    briefingLines: [`I finished ${title.endsWith(".") ? title : `your ${title.toLowerCase()}.`}`],
    waitLine: undefined,
  };
}

function primaryFromSnapshot(
  snapshot: HomePeerWorkspaceSnapshot,
  understanding: AdaptHandoffInput["understanding"]
): HandoffPrimaryWork | null {
  const { peer, workspace } = snapshot;
  const href = marketingWorkspaceHref(peer.id);

  const focus = resolveMarketingWorkflowFocus({
    generating: null,
    understanding,
    strategy: workspace.strategy ?? null,
    plan: workspace.plan ?? null,
    drafts: workspace.drafts ?? [],
    publicationPackages: workspace.publicationPackages ?? [],
  });

  if (focus.kind === "knowledge_incomplete") {
    const gap = understanding?.gaps[0];
    return {
      id: `${peer.id}-context`,
      title: gap ? formatGapLabel(gap) : "Company context",
      peerName: peer.name,
      peerId: peer.id,
      completedAt: null,
      completedAtLabel: null,
      contextLine: "Needed to continue",
      destination: gap ? knowledgeSectionHref(gapToKnowledgeSection(gap)) : "/company",
      kind: "context",
    };
  }

  const reviewDraft = workspace.drafts.find(
    (d) => d.status === "draft" || d.status === "ready_for_review"
  );
  if (reviewDraft) {
    return {
      id: reviewDraft.id,
      title: reviewDraft.title,
      peerName: peer.name,
      peerId: peer.id,
      completedAt: reviewDraft.generatedAt,
      completedAtLabel: formatCompletedLabel(reviewDraft.generatedAt),
      contextLine: "Ready for your review",
      destination: href,
      kind: "draft",
    };
  }

  const publishDraft = workspace.drafts.find((d) => d.status === "ready_to_publish");
  if (publishDraft) {
    return {
      id: publishDraft.id,
      title: publishDraft.title,
      peerName: peer.name,
      peerId: peer.id,
      completedAt: publishDraft.generatedAt,
      completedAtLabel: formatCompletedLabel(publishDraft.generatedAt),
      contextLine: "Ready to publish",
      destination: href,
      kind: "publication",
    };
  }

  if (workspace.plan?.summary) {
    return {
      id: `${peer.id}-plan`,
      title: workspace.plan.summary.length > 48 ? `${workspace.plan.summary.slice(0, 48)}…` : workspace.plan.summary,
      peerName: peer.name,
      peerId: peer.id,
      completedAt: workspace.plan.generatedAt,
      completedAtLabel: formatCompletedLabel(workspace.plan.generatedAt),
      contextLine: "Campaign plan",
      destination: href,
      kind: "plan",
    };
  }

  if (workspace.strategy?.summary) {
    return {
      id: `${peer.id}-strategy`,
      title: workspace.strategy.summary.length > 48 ? `${workspace.strategy.summary.slice(0, 48)}…` : workspace.strategy.summary,
      peerName: peer.name,
      peerId: peer.id,
      completedAt: workspace.strategy.generatedAt,
      completedAtLabel: formatCompletedLabel(workspace.strategy.generatedAt),
      contextLine: "Marketing strategy",
      destination: href,
      kind: "strategy",
    };
  }

  if (focus.kind === "ready_for_strategy") {
    return null;
  }

  return {
    id: `${peer.id}-workspace`,
    title: "Marketing workspace",
    peerName: peer.name,
    peerId: peer.id,
    completedAt: workspace.lastUpdated ?? null,
    completedAtLabel: formatCompletedLabel(workspace.lastUpdated),
    destination: href,
    kind: "workspace",
  };
}

export function adaptHandoffState(input: AdaptHandoffInput): HandoffState {
  const copy = getHomeCopy(input.locale ?? "en");
  const { viewModel, peers, marketingSnapshots, understanding } = input;
  const companyActivity = companyActivityFrom(viewModel.teamPulse);

  const marketingPeer =
    marketingSnapshots[0]?.peer ??
    peers.find((p) => p.role === "Marketing") ??
    peers[0] ??
    null;

  if (viewModel.isEmpty || peers.length === 0) {
    return finalizeHandoffState(
      {
      scene: "empty",
      urgency: "calm",
      greeting: "Your studio is ready.",
      briefingLines: [copy.emptyPeersBody],
      primaryWork: {
        id: "onboard",
        title: copy.emptyPeersCta,
        peerName: "Peergent",
        peerId: "",
        completedAt: null,
        completedAtLabel: null,
        destination: "/website-intelligence",
        kind: "onboarding",
      },
      secondaryWork: [],
      responsiblePeer: null,
      destination: "/website-intelligence",
      companyActivity,
      teamWorkingVisible: false,
    },
      input.firstName
    );
  }

  const topNeed = viewModel.needsYou[0];
  const secondaryWork = secondaryFromNeedsYou(viewModel.needsYou);

  if (topNeed) {
    const mapped = primaryFromNeedsYou(topNeed, copy);
    const waitLine =
      viewModel.needsYou.length > 1
        ? `${viewModel.needsYou.length - 1} other thing${viewModel.needsYou.length > 2 ? "s" : ""} can wait.`
        : mapped.waitLine;

    if (mapped.scene === "blocked") {
      return finalizeHandoffState(
        {
        scene: "blocked",
        urgency: "blocked",
        greeting: greetingFor(input.firstName).replace(getTimeGreeting(), "Morning"),
        briefingLines: mapped.briefingLines,
        blockedReason: mapped.work.title,
        primaryWork: mapped.work,
        secondaryWork,
        responsiblePeer: marketingPeer
          ? { id: marketingPeer.id, name: marketingPeer.name, role: marketingPeer.role }
          : null,
        destination: mapped.work.destination,
        companyActivity,
      },
        input.firstName
      );
    }

    if (mapped.scene === "urgent") {
      return finalizeHandoffState(
        {
        scene: "urgent",
        urgency: "urgent",
        greeting: "Morning.",
        briefingLines: mapped.briefingLines,
        primaryWork: mapped.work,
        secondaryWork,
        responsiblePeer: {
          id: topNeed.peerId,
          name: topNeed.peerName,
          role: marketingPeer?.role ?? "Marketing",
        },
        destination: mapped.work.destination,
        companyActivity,
      },
        input.firstName
      );
    }

    const briefingTitle = mapped.work.title;
    return finalizeHandoffState(
      {
      scene: "completed",
      urgency: "normal",
      greeting: "Morning.",
      briefingLines: [
        `I finished ${briefingTitle.endsWith(".") ? briefingTitle : briefingTitle.toLowerCase().startsWith("your") ? briefingTitle : `your ${briefingTitle.toLowerCase()}`}.`,
      ],
      waitLine,
      primaryWork: mapped.work,
      secondaryWork,
      responsiblePeer: {
        id: topNeed.peerId,
        name: topNeed.peerName,
        role: marketingPeer?.role ?? "Marketing",
      },
      destination: mapped.work.destination,
      companyActivity,
    },
      input.firstName
    );
  }

  if (viewModel.allCaughtUp && marketingSnapshots[0]) {
    const snapshot = marketingSnapshots[0];
    const work =
      primaryFromSnapshot(snapshot, understanding) ?? {
        id: `${snapshot.peer.id}-workspace`,
        title: "Marketing workspace",
        peerName: snapshot.peer.name,
        peerId: snapshot.peer.id,
        completedAt: null,
        completedAtLabel: null,
        destination: marketingWorkspaceHref(snapshot.peer.id),
        kind: "workspace" as const,
      };

    return finalizeHandoffState(
      {
      scene: "calm",
      urgency: "calm",
      greeting: "Morning.",
      briefingLines: ["Nothing urgent.", "I'm planning next week's content."],
      primaryWork: { ...work, contextLine: work.contextLine ?? "In progress" },
      secondaryWork: [],
      responsiblePeer: {
        id: snapshot.peer.id,
        name: snapshot.peer.name,
        role: snapshot.peer.role,
      },
      destination: work.destination,
      companyActivity,
    },
      input.firstName
    );
  }

  const snapshot = marketingSnapshots[0];
  if (snapshot) {
    const work = primaryFromSnapshot(snapshot, understanding);
    if (work?.kind === "context") {
      return finalizeHandoffState(
        {
        scene: "blocked",
        urgency: "blocked",
        greeting: "Morning.",
        briefingLines: [`I can't move forward without ${work.title.toLowerCase()}.`],
        blockedReason: work.title,
        primaryWork: work,
        secondaryWork: [],
        responsiblePeer: {
          id: snapshot.peer.id,
          name: snapshot.peer.name,
          role: snapshot.peer.role,
        },
        destination: work.destination,
        companyActivity,
      },
        input.firstName
      );
    }

    if (work) {
      return finalizeHandoffState(
        {
        scene: "completed",
        urgency: "normal",
        greeting: "Morning.",
        briefingLines: [`I finished ${work.title.toLowerCase().startsWith("your") ? work.title : `your ${work.title.toLowerCase()}`}.`],
        primaryWork: work,
        secondaryWork: [],
        responsiblePeer: {
          id: snapshot.peer.id,
          name: snapshot.peer.name,
          role: snapshot.peer.role,
        },
        destination: work.destination,
        companyActivity,
      },
        input.firstName
      );
    }
  }

  return finalizeHandoffState(
    {
    scene: "calm",
    urgency: "calm",
    greeting: greetingFor(input.firstName),
    briefingLines: [copy.allCaughtUpBody],
    primaryWork: marketingPeer
      ? {
          id: `${marketingPeer.id}-workspace`,
          title: "Open workspace",
          peerName: marketingPeer.name,
          peerId: marketingPeer.id,
          completedAt: null,
          completedAtLabel: null,
          destination: marketingWorkspaceHref(marketingPeer.id),
          kind: "workspace",
        }
      : null,
    secondaryWork: [],
    responsiblePeer: marketingPeer
      ? { id: marketingPeer.id, name: marketingPeer.name, role: marketingPeer.role }
      : null,
    destination: marketingPeer ? marketingWorkspaceHref(marketingPeer.id) : "/peers",
    companyActivity,
  },
    input.firstName
  );
}
