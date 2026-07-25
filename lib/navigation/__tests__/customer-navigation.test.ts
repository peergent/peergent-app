import { describe, expect, it } from "vitest";

import {
  CANONICAL_CUSTOMER_NAV_HREFS,
  customerNavigationItems,
  findVisibleCanonicalRouteCollisions,
  getCustomerNavigationItem,
  getNavigationItemByHref,
  getPrimaryCustomerNavigation,
  validateCustomerNavigation,
} from "../customer-navigation";
import { getRouteById } from "../route-manifest";

const EXPECTED_ITEM_IDS = [
  "nav.home",
  "nav.hq",
  "nav.inbox",
  "nav.team",
  "nav.company",
  "nav.knowledge",
  "nav.integrations",
  "nav.settings",
] as const;

describe("customer-navigation", () => {
  describe("canonical items", () => {
    it("includes all expected canonical navigation items", () => {
      const ids = customerNavigationItems.map((item) => item.id);
      for (const id of EXPECTED_ITEM_IDS) {
        expect(ids).toContain(id);
      }
      expect(customerNavigationItems).toHaveLength(EXPECTED_ITEM_IDS.length);
    });

    it("uses exactly the canonical customer href set", () => {
      const hrefs = customerNavigationItems.map((item) => item.href).sort();
      expect(hrefs).toEqual([...CANONICAL_CUSTOMER_NAV_HREFS].sort());
    });
  });

  describe("excluded routes", () => {
    it("does not expose legacy dashboard or peers routes as nav hrefs", () => {
      const hrefs = customerNavigationItems.map((item) => item.href);
      expect(hrefs).not.toContain("/dashboard");
      expect(hrefs).not.toContain("/peers");
      expect(hrefs.some((href) => href.startsWith("/peers/"))).toBe(false);
    });

    it("does not expose dev or design preview routes", () => {
      const hrefs = customerNavigationItems.map((item) => item.href);
      for (const href of hrefs) {
        expect(href.startsWith("/dev")).toBe(false);
        expect(href.startsWith("/design-preview")).toBe(false);
        expect(href).not.toBe("/studio-shell-preview");
      }
    });
  });

  describe("route manifest references", () => {
    it("links every item to an existing manifest route with matching href", () => {
      for (const item of customerNavigationItems) {
        const route = getRouteById(item.routeId);
        expect(route, item.id).toBeDefined();
        expect(route?.path).toBe(item.href);
      }
    });
  });

  describe("integrity", () => {
    it("has no duplicate item IDs or hrefs", () => {
      const ids = customerNavigationItems.map((item) => item.id);
      const hrefs = customerNavigationItems.map((item) => item.href);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    });
  });

  describe("primary navigation", () => {
    it("returns primary visibility items in manifest order", () => {
      const primary = getPrimaryCustomerNavigation();
      expect(primary.map((item) => item.id)).toEqual([
        "nav.home",
        "nav.inbox",
        "nav.team",
      ]);
      expect(primary.every((item) => item.visibility === "PRIMARY")).toBe(true);
    });
  });

  describe("lookup behavior", () => {
    it("finds items by id and href", () => {
      expect(getCustomerNavigationItem("nav.inbox")?.href).toBe("/inbox");
      expect(getNavigationItemByHref("/team")?.id).toBe("nav.team");
    });

    it("resolves legacy alias hrefs without listing them as nav targets", () => {
      expect(getNavigationItemByHref("/dashboard")?.id).toBe("nav.home");
      expect(getNavigationItemByHref("/peers")?.id).toBe("nav.team");
    });

    it("returns undefined for unknown hrefs", () => {
      expect(getCustomerNavigationItem("nav.missing")).toBeUndefined();
      expect(getNavigationItemByHref("/unknown")).toBeUndefined();
    });
  });

  describe("validateCustomerNavigation", () => {
    it("returns no validation errors", () => {
      expect(validateCustomerNavigation()).toEqual([]);
    });

    it("detects visible canonical route collisions", () => {
      const knowledge = customerNavigationItems.find(
        (item) => item.id === "nav.knowledge"
      );
      expect(knowledge?.visibility).toBe("HIDDEN");

      const visibleKnowledge = customerNavigationItems.map((item) =>
        item.id === "nav.knowledge"
          ? { ...item, visibility: "SECONDARY" as const }
          : item
      );
      expect(findVisibleCanonicalRouteCollisions(visibleKnowledge).length).toBe(
        1
      );
    });
  });
});
