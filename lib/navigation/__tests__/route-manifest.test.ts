import { describe, expect, it } from "vitest";

import {
  getCanonicalRoute,
  getRouteById,
  getRouteByPath,
  getRouteManifest,
  isCustomerRoute,
  isDevelopmentOnlyRoute,
  isLegacyRoute,
  matchRoute,
} from "../route-manifest";

describe("route-manifest", () => {
  describe("exact static route matching", () => {
    it("matches root and primary customer surfaces", () => {
      expect(getRouteByPath("/")?.id).toBe("marketing.root");
      expect(getRouteByPath("/home")?.id).toBe("customer.home");
      expect(getRouteByPath("/hq")?.id).toBe("customer.hq");
      expect(getRouteByPath("/inbox")?.id).toBe("customer.inbox");
      expect(getRouteByPath("/team")?.id).toBe("customer.team.index");
    });

    it("matches auth routes", () => {
      expect(getRouteByPath("/login")?.id).toBe("auth.login");
      expect(getRouteByPath("/auth/callback")?.id).toBe("auth.callback");
      expect(getRouteByPath("/auth/post-login")?.id).toBe("auth.post-login");
    });

    it("normalizes trailing slashes for static paths", () => {
      expect(getRouteByPath("/home/")?.id).toBe("customer.home");
    });
  });

  describe("dynamic route matching", () => {
    it("matches peer studio root", () => {
      const route = getRouteByPath("/team/abc");
      expect(route?.id).toBe("customer.team.peer");
      expect(matchRoute("/team/abc")?.params).toEqual({ peerId: "abc" });
    });

    it("matches legacy peer detail", () => {
      const route = getRouteByPath("/peers/abc");
      expect(route?.id).toBe("legacy.peers.detail");
      expect(matchRoute("/peers/abc")?.params).toEqual({ id: "abc" });
    });
  });

  describe("nested dynamic route matching", () => {
    it("matches project detail under peer", () => {
      const pathname = "/team/abc/projects/project-1";
      expect(getRouteByPath(pathname)?.id).toBe("customer.team.project");
      expect(matchRoute(pathname)?.params).toEqual({
        peerId: "abc",
        projectId: "project-1",
      });
    });

    it("matches content and responsibility detail routes", () => {
      expect(getRouteByPath("/team/p1/content/c9")?.id).toBe(
        "customer.team.content.detail"
      );
      expect(getRouteByPath("/team/p1/responsibilities/r42")?.id).toBe(
        "customer.team.responsibility.detail"
      );
    });

    it("prefers more specific templates over peer root", () => {
      expect(getRouteByPath("/team/abc/work")?.id).toBe("customer.team.work");
      expect(getRouteByPath("/team/abc/settings")?.id).toBe(
        "customer.team.settings"
      );
    });
  });

  describe("canonical route resolution", () => {
    it("resolves dashboard alias to home", () => {
      expect(getCanonicalRoute("/dashboard")?.path).toBe("/home");
    });

    it("resolves legacy peers marketing to team studio with same id", () => {
      const canonical = getCanonicalRoute("/peers/peer-99/marketing");
      expect(canonical?.path).toBe("/team/[peerId]");
      expect(getRouteByPath("/team/peer-99")?.id).toBe(canonical?.id);
    });

    it("resolves automations alias to responsibilities", () => {
      expect(getCanonicalRoute("/team/x/automations")?.path).toBe(
        "/team/[peerId]/responsibilities"
      );
    });

    it("returns canonical entry for already-canonical paths", () => {
      expect(getCanonicalRoute("/home")?.id).toBe("customer.home");
    });
  });

  describe("legacy route detection", () => {
    it("detects alias and legacy manifest entries", () => {
      expect(isLegacyRoute("/dashboard")).toBe(true);
      expect(isLegacyRoute("/peers")).toBe(true);
      expect(isLegacyRoute("/peers/abc")).toBe(true);
      expect(isLegacyRoute("/knowledge")).toBe(true);
    });

    it("does not mark canonical customer routes as legacy", () => {
      expect(isLegacyRoute("/home")).toBe(false);
      expect(isLegacyRoute("/team/abc")).toBe(false);
    });
  });

  describe("development-only route detection", () => {
    it("detects dev playground routes", () => {
      expect(isDevelopmentOnlyRoute("/dev/context")).toBe(true);
      expect(isDevelopmentOnlyRoute("/dev/prompt")).toBe(true);
    });

    it("detects design preview and studio shell preview", () => {
      expect(isDevelopmentOnlyRoute("/design-preview/hq")).toBe(true);
      expect(isDevelopmentOnlyRoute("/design-preview/hq-b")).toBe(true);
      expect(isDevelopmentOnlyRoute("/studio-shell-preview")).toBe(true);
    });

    it("does not mark production customer routes as dev-only", () => {
      expect(isDevelopmentOnlyRoute("/home")).toBe(false);
      expect(isDevelopmentOnlyRoute("/team/abc")).toBe(false);
    });
  });

  describe("customer route detection", () => {
    it("includes canonical and legacy customer-facing paths", () => {
      expect(isCustomerRoute("/home")).toBe(true);
      expect(isCustomerRoute("/peers/abc")).toBe(true);
      expect(isCustomerRoute("/dashboard")).toBe(true);
    });

    it("excludes auth and dev routes", () => {
      expect(isCustomerRoute("/login")).toBe(false);
      expect(isCustomerRoute("/dev/prompt")).toBe(false);
      expect(isCustomerRoute("/design-preview/hq")).toBe(false);
    });
  });

  describe("unknown route behavior", () => {
    it("returns undefined for unregistered paths", () => {
      expect(getRouteByPath("/does-not-exist")).toBeUndefined();
      expect(getCanonicalRoute("/does-not-exist")).toBeUndefined();
      expect(isCustomerRoute("/does-not-exist")).toBe(false);
      expect(isLegacyRoute("/does-not-exist")).toBe(false);
      expect(isDevelopmentOnlyRoute("/does-not-exist")).toBe(false);
    });
  });

  describe("manifest integrity", () => {
    it("has no duplicate route IDs", () => {
      const ids = getRouteManifest().map((entry) => entry.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it("has no duplicate exact static paths", () => {
      const staticPaths = getRouteManifest()
        .map((entry) => entry.path)
        .filter((path) => !path.includes("[") && !path.endsWith("/*"));

      const unique = new Set(staticPaths);
      expect(unique.size).toBe(staticPaths.length);
    });

    it("resolves every manifest id via getRouteById", () => {
      for (const entry of getRouteManifest()) {
        expect(getRouteById(entry.id)).toEqual(entry);
      }
    });
  });
});
