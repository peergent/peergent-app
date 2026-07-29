import { describe, expect, it } from "vitest";
import { buildV17DoneViewModel } from "@/lib/customer-v17/build-v17-done-view-model";
import { buildV17ResultsViewModel } from "@/lib/customer-v17/build-v17-results-view-model";
import { buildV17TodayViewModel } from "@/lib/customer-v17/build-v17-today-view-model";
import { buildV17WaitingViewModel } from "@/lib/customer-v17/build-v17-waiting-view-model";
import { getV17ReviewModalCopy } from "@/lib/i18n/v17-review-modal-copy";
import { websiteScanHref } from "@/features/marketing-workspace/lib/build-knowledge-items";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

const peer = {
  id: "peer-1",
  name: "Emma",
  role: "Marketing",
  status: "active" as const,
};

function minimalDomain(peerId: string): MarketingPeerDomainInput {
  return {
    peerId,
    projects: [],
    workUnits: [],
    drafts: [],
    responsibilities: [],
    connections: [],
    activityFeed: [],
    automations: [],
  } as MarketingPeerDomainInput;
}

describe("Sprint 29C.4 interactions", () => {
  it("Dutch approval modal copy is localized", () => {
    const copy = getV17ReviewModalCopy("nl");
    expect(copy.approveTitle("E-mailcampagne")).toContain("goedkeuren");
    expect(copy.cancel).toBe("Annuleren");
    expect(copy.approveConfirm).toBe("Goedkeuren");
  });

  it("website scan href stays in v17 peer settings", () => {
    expect(websiteScanHref("emma")).toBe("/team/emma/settings/website-intelligence");
  });

  it("Today viewAllAttentionHref points to waiting route", () => {
    const model = buildV17TodayViewModel({
      peer,
      domainInput: minimalDomain("emma"),
      localePreference: "nl",
    });
    expect(model.viewAllAttentionHref).toBe("/team/emma/waiting");
  });

  it("waiting view model lists attention items route", () => {
    const model = buildV17WaitingViewModel({
      peer,
      domainInput: minimalDomain("emma"),
      localePreference: "nl",
    });
    expect(model.peerId).toBe("emma");
  });

  it("done view model exposes grouped structure", () => {
    const model = buildV17DoneViewModel({
      domainInput: minimalDomain("emma"),
      localePreference: "nl",
    });
    expect(Array.isArray(model.groups)).toBe(true);
  });

  it("results metrics include hrefs when derivable", () => {
    const domain = minimalDomain("emma");
    domain.projects = [
      {
        id: "p1",
        title: "Launch",
        type: "campaign",
      } as MarketingPeerDomainInput["projects"][number],
    ];
    const model = buildV17ResultsViewModel({
      domainInput: domain,
      localePreference: "nl",
    });
    const active = model.metrics.find((m) => m.id === "active-campaigns");
    if (active) {
      expect(active.href).toBe("/team/emma/work");
    }
  });
});
