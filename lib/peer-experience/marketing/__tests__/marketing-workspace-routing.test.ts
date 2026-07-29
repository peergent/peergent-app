import { describe, expect, it } from "vitest";
import { MARKETING_PEER_TABS } from "../navigation/marketing-peer-links";
import {
  resolveActiveMarketingPeerCustomerSection,
  resolveActiveMarketingPeerSection,
} from "../navigation/marketing-peer-sections";

describe("Marketing workspace routing", () => {
  it("lists four customer sections in approved order", () => {
    expect(MARKETING_PEER_TABS.map((t) => t.id)).toEqual([
      "today",
      "work",
      "results",
      "settings",
    ]);
  });

  it("defaults peer root to today", () => {
    expect(resolveActiveMarketingPeerCustomerSection("/team/emma", "emma")).toBe("today");
    expect(resolveActiveMarketingPeerSection("/team/emma", "emma")).toBe("working_on");
  });

  it("maps legacy waiting path to today nav with waiting section id", () => {
    expect(resolveActiveMarketingPeerCustomerSection("/team/emma/waiting", "emma")).toBe(
      "today"
    );
    expect(resolveActiveMarketingPeerSection("/team/emma/waiting", "emma")).toBe(
      "waiting_for_me"
    );
  });

  it("maps legacy review path to waiting for me section id", () => {
    expect(resolveActiveMarketingPeerSection("/team/emma/review", "emma")).toBe(
      "waiting_for_me"
    );
  });

  it("done path stays compatible", () => {
    expect(resolveActiveMarketingPeerCustomerSection("/team/emma/done", "emma")).toBe("today");
    expect(resolveActiveMarketingPeerSection("/team/emma/done", "emma")).toBe("done");
  });
});
