import { describe, expect, it } from "vitest";
import { buildDeduplicatedCompletedOutcomes } from "../build-deduplicated-outcomes";
import {
  isRawInternalStatus,
  localizeOutcomePresentation,
  normalizeAttentionTitle,
  presenceWaitingNarrative,
} from "../normalize-customer-workspace-content";
import { buildMarketingPeerWorkspacePresence } from "../build-marketing-peer-presence";
import { buildMarketingPeerWorkingOnViewModel } from "../build-marketing-peer-sections";
import { getMarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { getPeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { detectSafeFailure } from "../detect-safe-failure";
import {
  createWorkUnit,
  revertWorkUnitFromFailedExecution,
} from "@/lib/peer-workflow/work-unit-engine";
import type { MarketingPeerDomainInput } from "../../view-models/marketing-peer-domain-input";

const baseInput: MarketingPeerDomainInput = {
  peerId: "peer-emma",
  userName: "Pilot",
  peerName: "Emma",
  campaignTitle: "Summer",
  generating: null,
  generatingActivity: null,
  understanding: {
    available: true,
    sparse: false,
    completeness: 80,
    gaps: [],
    brand: { values: [], toneOfVoice: {}, keyMessages: [] },
    products: [],
    services: [],
    customerSegments: [],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: "2026-07-28T00:00:00.000Z",
  },
  strategy: null,
  plan: null,
  drafts: [],
  publicationPackages: [],
  activityFeed: [],
  workUnits: [],
  projects: [],
  responsibilities: [],
  automations: [],
  connections: [],
};

describe("normalize-customer-workspace-content", () => {
  it("uses accurate Dutch waiting narrative", () => {
    expect(presenceWaitingNarrative(10, "nl")).toContain("10 onderdelen");
    expect(presenceWaitingNarrative(10, "nl")).not.toContain("klaargezet");
  });

  it("normalizes review titles in Dutch", () => {
    expect(normalizeAttentionTitle("Review marketing strategy", "nl")).toBe(
      "Campagnestrategie beoordelen"
    );
  });

  it("detects raw internal status tokens", () => {
    expect(isRawInternalStatus("Approved.")).toBe(true);
    expect(isRawInternalStatus("Campagnestrategie afgerond")).toBe(false);
  });

  it("localizes outcome titles in Dutch", () => {
    const { title } = localizeOutcomePresentation({
      activity: {
        id: "a1",
        type: "approved",
        typeLabel: "Approved",
        title: "Approved.",
        occurredAt: new Date().toISOString(),
        timeLabel: "now",
        actionLabel: "Open",
        target: { kind: "project", href: "/x", id: "p1" },
      },
      locale: "nl",
      projectTitle: "Peergent Test launch",
    });
    expect(title).toBe("Goedkeuring vastgelegd");
    expect(title).not.toMatch(/^Approved/i);
  });
});

describe("buildMarketingPeerWorkspacePresence", () => {
  it("uses caught up when idle with no queue", () => {
    const presence = buildMarketingPeerWorkspacePresence({
      domainInput: baseInput,
      campaignCopy: getMarketingCampaignCopy("en"),
      workspaceCopy: getPeerWorkspaceCopy("en"),
      attentionCount: 0,
      waitingPrimaryHref: null,
      locale: "en",
    });
    expect(presence.state).toBe("caught_up");
    expect(presence.showLiveIndicator).toBe(false);
  });
});

describe("working on primary action", () => {
  it("exposes at most one primary action in focus mode", () => {
    const vm = buildMarketingPeerWorkingOnViewModel({
      domainInput: baseInput,
      presenceNarrative: "Working",
      presenceState: "working",
      campaignCopy: getMarketingCampaignCopy("en"),
      workspaceCopy: getPeerWorkspaceCopy("en"),
      locale: "en",
      relatedHref: "/team/peer-emma/work",
      waitingHref: "/team/peer-emma/waiting",
      attentionCount: 0,
    });
    expect(vm.primaryAction?.label).toBeTruthy();
    expect(vm.mode).toBe("focus");
  });
});

describe("done deduplication", () => {
  it("collapses multiple strategy-related activities per project", () => {
    const now = new Date().toISOString();
    const outcomes = buildDeduplicatedCompletedOutcomes({
      domainInput: {
        ...baseInput,
        activityFeed: [
          {
            id: "1",
            timestamp: now,
            activityType: "strategy_completed",
            title: "Strategy",
            description: "Done",
            relatedObject: "Launch",
          },
          {
            id: "2",
            timestamp: now,
            activityType: "draft_approved",
            title: "Launch",
            description: "Approved.",
            relatedObject: "Launch",
          },
        ],
        projects: [
          {
            id: "p1",
            peerId: "peer-emma",
            title: "Launch",
            goal: "g",
            campaignType: "product_launch",
            createdAt: now,
            updatedAt: now,
            ownerLabel: "u",
            rawRequest: "",
          },
        ],
      },
      locale: "nl",
    });
    const strategyOutcomes = outcomes.filter((o) =>
      o.title.includes("Campagnestrategie")
    );
    expect(strategyOutcomes.length).toBeLessThanOrEqual(1);
    if (strategyOutcomes[0]?.summary) {
      expect(isRawInternalStatus(strategyOutcomes[0].summary)).toBe(false);
    }
  });
});

const INTERNAL_FAILURE_MESSAGE =
  "OpenAI responses call threw TypeError at validateOutput (stack redacted)";

function failedWorkUnit(overrides?: { cancelled?: boolean; projectId?: string }) {
  const unit = createWorkUnit({
    peerId: "peer-emma",
    role: "Marketing",
    title: "the LinkedIn post for Summer",
    deliverableKind: "linkedin",
    channel: "linkedin",
    objective: null,
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "",
    projectId: overrides?.projectId ?? "p1",
  });
  const failed = revertWorkUnitFromFailedExecution(unit, INTERNAL_FAILURE_MESSAGE);
  return { ...failed, cancelled: overrides?.cancelled ?? false };
}

describe("detectSafeFailure", () => {
  it("returns null when nothing has failed", () => {
    expect(detectSafeFailure([])).toBeNull();
  });

  it("detects a genuine rolled-back execution", () => {
    const signal = detectSafeFailure([failedWorkUnit()]);
    expect(signal).not.toBeNull();
    expect(signal?.workTitle).toBe("the LinkedIn post for Summer");
    expect(signal?.projectId).toBe("p1");
  });

  it("never surfaces the internal failure message", () => {
    const signal = detectSafeFailure([failedWorkUnit()]);
    expect(JSON.stringify(signal)).not.toContain("OpenAI");
    expect(JSON.stringify(signal)).not.toContain("TypeError");
  });

  it("ignores cancelled work the customer ended deliberately", () => {
    expect(detectSafeFailure([failedWorkUnit({ cancelled: true })])).toBeNull();
  });

  it("treats a failure as resolved once the Peer progressed afterwards", () => {
    const failed = failedWorkUnit();
    const progressed = {
      ...failed,
      eventLog: [
        ...failed.eventLog,
        {
          id: "evt-after",
          at: new Date(Date.now() + 1000).toISOString(),
          event: "planning_started" as const,
          fromStage: "planning" as const,
          toStage: "creating" as const,
          note: "Retry started.",
        },
      ],
    };
    expect(detectSafeFailure([progressed])).toBeNull();
  });
});

describe("presence: needs help (Failed safely)", () => {
  it("emits needs_help and outranks waiting for you", () => {
    const presence = buildMarketingPeerWorkspacePresence({
      domainInput: { ...baseInput, workUnits: [failedWorkUnit()] },
      campaignCopy: getMarketingCampaignCopy("en"),
      workspaceCopy: getPeerWorkspaceCopy("en"),
      // A pending decision must NOT win over a real failure (priority §4).
      attentionCount: 3,
      waitingPrimaryHref: null,
      locale: "en",
    });
    expect(presence.state).toBe("needs_help");
    expect(presence.stateLabel).toBe("Needs help");
    expect(presence.showLiveIndicator).toBe(false);
    expect(presence.primaryActionHref).toBeTruthy();
    expect(presence.primaryActionLabel).toBe("See what happened");
  });

  it("reassures that work is preserved without leaking internals", () => {
    const presence = buildMarketingPeerWorkspacePresence({
      domainInput: { ...baseInput, workUnits: [failedWorkUnit()] },
      campaignCopy: getMarketingCampaignCopy("en"),
      workspaceCopy: getPeerWorkspaceCopy("en"),
      attentionCount: 0,
      waitingPrimaryHref: null,
      locale: "en",
    });
    expect(presence.narrative).toContain("Nothing is lost");
    expect(presence.narrative).not.toContain("OpenAI");
    expect(presence.narrative).not.toContain("TypeError");
    expect(isRawInternalStatus(presence.narrative)).toBe(false);
  });

  it("uses Dutch copy for the failure state", () => {
    const presence = buildMarketingPeerWorkspacePresence({
      domainInput: { ...baseInput, workUnits: [failedWorkUnit()] },
      campaignCopy: getMarketingCampaignCopy("nl"),
      workspaceCopy: getPeerWorkspaceCopy("nl"),
      attentionCount: 0,
      waitingPrimaryHref: null,
      locale: "nl",
    });
    expect(presence.state).toBe("needs_help");
    expect(presence.stateLabel).toBe("Hulp nodig");
    expect(presence.narrative).toContain("niets verloren");
  });

  it("does not classify ordinary idle waiting as failure", () => {
    const presence = buildMarketingPeerWorkspacePresence({
      domainInput: baseInput,
      campaignCopy: getMarketingCampaignCopy("en"),
      workspaceCopy: getPeerWorkspaceCopy("en"),
      attentionCount: 2,
      waitingPrimaryHref: null,
      locale: "en",
    });
    expect(presence.state).toBe("waiting_for_you");
  });
});
