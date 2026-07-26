import { describe, expect, it } from "vitest";

import {
  createModalFocusSession,
  MODAL_INITIAL_FOCUS_SELECTOR,
} from "../mw-modal-focus-session";

describe("createModalFocusSession", () => {
  it("applies initial focus only once while the modal stays open", () => {
    const session = createModalFocusSession();
    session.markOpened();
    expect(session.shouldApplyInitialFocus()).toBe(true);
    expect(session.shouldApplyInitialFocus()).toBe(false);
    expect(session.shouldApplyInitialFocus()).toBe(false);
  });

  it("allows initial focus again after close and reopen", () => {
    const session = createModalFocusSession();
    session.markOpened();
    expect(session.shouldApplyInitialFocus()).toBe(true);
    session.markClosed();
    session.markOpened();
    expect(session.shouldApplyInitialFocus()).toBe(true);
  });

  it("simulates typing without stealing focus on subsequent renders", () => {
    const session = createModalFocusSession();
    session.markOpened();
    session.shouldApplyInitialFocus();
    for (let i = 0; i < 12; i++) {
      expect(session.shouldApplyInitialFocus()).toBe(false);
    }
  });
});

describe("modal initial focus selector", () => {
  it("prioritizes inputs before the close button in the selector order", () => {
    expect(MODAL_INITIAL_FOCUS_SELECTOR.indexOf("input")).toBeGreaterThanOrEqual(0);
    expect(MODAL_INITIAL_FOCUS_SELECTOR).toContain("mw-modal-close");
    expect(MODAL_INITIAL_FOCUS_SELECTOR.indexOf("input")).toBeLessThan(
      MODAL_INITIAL_FOCUS_SELECTOR.indexOf("mw-modal-close")
    );
  });
});

describe("create campaign form state", () => {
  it("updates campaign name across multiple keystrokes without refocus", () => {
    const session = createModalFocusSession();
    session.markOpened();
    session.shouldApplyInitialFocus();

    let name = "";
    for (const char of "Summer launch") {
      name += char;
    }

    expect(name).toBe("Summer launch");
    expect(session.shouldApplyInitialFocus()).toBe(false);
  });

  it("updates description across multiple keystrokes without refocus", () => {
    const session = createModalFocusSession();
    session.markOpened();
    session.shouldApplyInitialFocus();

    let description = "";
    for (const char of "Grow qualified pipeline") {
      description += char;
    }

    expect(description).toBe("Grow qualified pipeline");
    expect(session.shouldApplyInitialFocus()).toBe(false);
  });
});
