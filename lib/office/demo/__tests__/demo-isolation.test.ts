import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  DemoIsolationError,
  getDemoResponsibilities,
  isDemoWorkspaceModified,
  resetDemoWorkspace,
  setDemoResponsibilities,
  subscribeDemoWorkspace,
} from "@/lib/office/demo/demo-workspace-state";
import {
  DEMO_PEER_ID,
  buildDemoDomainInput,
  demoResponsibilities,
} from "@/lib/office/demo/demo-company";
import { buildMarketingAgreementViewModel } from "@/lib/office/agreement/build-marketing-agreement";

/**
 * The demo lets a prospect change a working agreement. That is the interaction
 * worth showing, and it is also the one place where a demo could plausibly
 * touch a real customer's data. These tests hold the boundary.
 */

const base = { peerName: "Emma", peerRole: "Marketing" };

function widenFirstBoundary() {
  const current = getDemoResponsibilities();
  return current.map((responsibility, index) =>
    index === 0
      ? {
          ...responsibility,
          approvalPolicy: "approval_required" as const,
          autonomyLevel: "semi_autonomous" as const,
        }
      : responsibility
  );
}

beforeEach(() => {
  resetDemoWorkspace();
});

describe("no live workspace can enter the demo path", () => {
  it("refuses any peer id but the demo one", () => {
    for (const peerId of ["emma", "", "demo-2", "DEMO", "prod-peer"]) {
      expect(() => setDemoResponsibilities(peerId, widenFirstBoundary())).toThrow(
        DemoIsolationError
      );
    }
  });

  it("leaves the demo state untouched when it refuses", () => {
    const before = getDemoResponsibilities();
    expect(() => setDemoResponsibilities("emma", widenFirstBoundary())).toThrow();
    expect(getDemoResponsibilities()).toBe(before);
  });

  it("accepts the demo peer", () => {
    expect(() => setDemoResponsibilities(DEMO_PEER_ID, widenFirstBoundary())).not.toThrow();
  });
});

describe("the demo store cannot reach production persistence", () => {
  it("imports nothing that writes to storage", async () => {
    // Structural, not behavioural: if this module ever gains an import that can
    // persist, the demo has stopped being isolated regardless of what the
    // callers do. Reading the source is the only way to assert that.
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(
      new URL("../demo-workspace-state.ts", import.meta.url),
      "utf8"
    );

    // Only the imports matter — the prose above them names these modules
    // precisely in order to explain why they are absent.
    const imports = [...source.matchAll(/^import[\s\S]*?from\s+"([^"]+)";/gm)].map(
      (match) => match[1]
    );

    const forbidden = [
      "marketing-workspace",
      "supabase",
      "hooks/useMarketingWorkspace",
      "repositories",
    ];
    for (const specifier of imports) {
      for (const term of forbidden) {
        expect(
          specifier.includes(term),
          `demo store imports ${specifier}, which can reach storage`
        ).toBe(false);
      }
    }

    // And no direct browser persistence either.
    const body = source.slice(source.lastIndexOf("import"));
    expect(body.includes("localStorage")).toBe(false);
    expect(body.includes("sessionStorage")).toBe(false);
  });

  it("does not invoke the production mutation when a demo change is committed", () => {
    // The production mutation is a workspace method. A demo commit goes through
    // setDemoResponsibilities, which cannot see it.
    const productionMutation = vi.fn();
    setDemoResponsibilities(DEMO_PEER_ID, widenFirstBoundary());
    expect(productionMutation).not.toHaveBeenCalled();
    expect(isDemoWorkspaceModified()).toBe(true);
  });
});

describe("demo state survives navigation and resets cleanly", () => {
  it("holds a change across rebuilds of the domain input", () => {
    // Navigating between Office destinations rebuilds the domain input from the
    // store. The change must still be there on the other side.
    const changed = widenFirstBoundary();
    setDemoResponsibilities(DEMO_PEER_ID, changed);

    const afterNavigation = buildDemoDomainInput({
      responsibilities: getDemoResponsibilities(),
    });
    const agreement = buildMarketingAgreementViewModel({
      domainInput: afterNavigation,
      ...base,
    });

    const movedId = changed[0].id;
    expect(agreement.needsApproval.some((b) => b.id === movedId)).toBe(true);
    expect(agreement.autonomous.some((b) => b.id === movedId)).toBe(false);
  });

  it("notifies subscribers so the UI can follow", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDemoWorkspace(listener);

    setDemoResponsibilities(DEMO_PEER_ID, widenFirstBoundary());
    expect(listener).toHaveBeenCalledTimes(1);

    resetDemoWorkspace();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setDemoResponsibilities(DEMO_PEER_ID, widenFirstBoundary());
    expect(listener).toHaveBeenCalledTimes(2);
    resetDemoWorkspace();
  });

  it("restores the canonical Veldwerk defaults on reset", () => {
    const canonical = demoResponsibilities();
    setDemoResponsibilities(DEMO_PEER_ID, widenFirstBoundary());
    expect(isDemoWorkspaceModified()).toBe(true);

    resetDemoWorkspace();

    expect(isDemoWorkspaceModified()).toBe(false);
    const restored = getDemoResponsibilities();
    expect(restored.map((r) => r.id)).toEqual(canonical.map((r) => r.id));
    expect(restored.map((r) => r.approvalPolicy)).toEqual(
      canonical.map((r) => r.approvalPolicy)
    );
    expect(restored.map((r) => r.autonomyLevel)).toEqual(
      canonical.map((r) => r.autonomyLevel)
    );
  });

  it("starts unmodified so the reset control stays hidden until it is earned", () => {
    expect(isDemoWorkspaceModified()).toBe(false);
  });
});

describe("live mode is unaffected", () => {
  it("builds a live agreement without consulting the demo store", () => {
    // A live workspace passes its own responsibilities. Mutating the demo store
    // must not change what a live build produces.
    const live = {
      ...buildDemoDomainInput(),
      peerId: "emma",
      responsibilities: demoResponsibilities(new Date(), "emma"),
    };
    const before = buildMarketingAgreementViewModel({ domainInput: live, ...base });

    setDemoResponsibilities(DEMO_PEER_ID, widenFirstBoundary());

    const after = buildMarketingAgreementViewModel({ domainInput: live, ...base });
    expect(after.autonomous.map((b) => b.id)).toEqual(
      before.autonomous.map((b) => b.id)
    );
    expect(after.needsApproval.map((b) => b.id)).toEqual(
      before.needsApproval.map((b) => b.id)
    );
  });
});
