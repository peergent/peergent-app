import { describe, expect, it } from "vitest";

import {
  customerNavigationItems,
  findVisibleCanonicalRouteCollisions,
  type NavigationItem,
  validateCustomerNavigation,
} from "../customer-navigation";
import {
  buildCustomerNavigationView,
  getVisibleCanonicalDestinationKeys,
  groupNavigationBySection,
  resolveActiveNavigationItem,
  resolveNavigationHref,
} from "../navigation-adapter";

describe("navigation-adapter", () => {
  describe("canonical collision detection", () => {
    it("reports when two visible items share a canonical destination", () => {
      const knowledge = customerNavigationItems.find(
        (item) => item.id === "nav.knowledge"
      );
      expect(knowledge).toBeDefined();

      const withVisibleKnowledge: NavigationItem[] = customerNavigationItems.map(
        (item) =>
          item.id === "nav.knowledge"
            ? { ...item, visibility: "SECONDARY" as const }
            : { ...item }
      );

      const errors = findVisibleCanonicalRouteCollisions(withVisibleKnowledge);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("nav.company");
      expect(errors[0]).toContain("nav.knowledge");
      expect(errors[0]).toContain("customer.company");
    });

    it("passes collision checks when Knowledge remains hidden", () => {
      expect(findVisibleCanonicalRouteCollisions()).toEqual([]);
      expect(validateCustomerNavigation()).toEqual([]);
    });
  });

  describe("buildCustomerNavigationView", () => {
    it("excludes hidden Knowledge from the default view", () => {
      const view = buildCustomerNavigationView();
      expect(view.some((item) => item.id === "nav.knowledge")).toBe(false);
      expect(view.some((item) => item.id === "nav.company")).toBe(true);
    });

    it("includes hidden Knowledge when includeHidden is true", () => {
      const view = buildCustomerNavigationView({ includeHidden: true });
      expect(view.some((item) => item.id === "nav.knowledge")).toBe(true);
    });

    it("has no duplicate visible canonical destinations in the default view", () => {
      const keys = getVisibleCanonicalDestinationKeys();
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe("resolveActiveNavigationItem", () => {
    it("maps /dashboard to Command Center (home)", () => {
      const active = resolveActiveNavigationItem("/dashboard");
      expect(active?.itemId).toBe("nav.home");
      expect(active?.href).toBe("/home");
    });

    it("maps /peers and nested legacy peer paths to Team", () => {
      expect(resolveActiveNavigationItem("/peers")?.itemId).toBe("nav.team");
      expect(resolveActiveNavigationItem("/peers/peer-1")?.itemId).toBe(
        "nav.team"
      );
    });

    it("maps /knowledge to Company while Knowledge is hidden", () => {
      const active = resolveActiveNavigationItem("/knowledge");
      expect(active?.itemId).toBe("nav.company");
      expect(active?.canonicalHref).toBe("/company");
    });

    it("resolves canonical customer paths", () => {
      expect(resolveActiveNavigationItem("/home")?.itemId).toBe("nav.home");
      expect(resolveActiveNavigationItem("/team/abc")?.itemId).toBe("nav.team");
      expect(resolveActiveNavigationItem("/company")?.itemId).toBe("nav.company");
    });

    it("returns no active item for unknown paths", () => {
      expect(resolveActiveNavigationItem("/does-not-exist")).toBeUndefined();
      expect(resolveActiveNavigationItem("/dev/prompt")).toBeUndefined();
    });
  });

  describe("resolveNavigationHref", () => {
    it("returns the active navigation href for alias paths", () => {
      expect(resolveNavigationHref("/dashboard")).toBe("/home");
      expect(resolveNavigationHref("/peers")).toBe("/team");
    });
  });

  describe("groupNavigationBySection", () => {
    it("groups visible items by section order", () => {
      const view = buildCustomerNavigationView();
      const grouped = groupNavigationBySection(view);

      expect(grouped.map((entry) => entry.section.id)).toEqual([
        "OPERATE",
        "WORKFORCE",
        "ORGANIZATION",
        "SYSTEM",
      ]);

      const operateIds = grouped[0].items.map((item) => item.id);
      expect(operateIds).toContain("nav.home");
      expect(operateIds).not.toContain("nav.knowledge");

      const organizationIds = grouped[2].items.map((item) => item.id);
      expect(organizationIds).toEqual(["nav.company"]);
    });
  });
});
