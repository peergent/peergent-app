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
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";

const baseInput: MarketingPeerDomainInput = {
  peerId: "peer-emma",
  userName: "Pilot",
  peerName: "Emma",
  campaignTitle: "Summer",
  generating: null,
  generatingActivity: null,
  understanding: { available: true, completeness: 80, gaps: [], summary: "", lastUpdated: "" },
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
            campaignType: "launch",
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
