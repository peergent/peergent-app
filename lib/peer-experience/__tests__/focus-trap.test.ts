import { describe, expect, it, vi } from "vitest";
import { handleFocusTrapKeyDown } from "@/lib/peer-experience/focus-trap";

describe("handleFocusTrapKeyDown", () => {
  it("wraps focus from last element to first on Tab", () => {
    const first = { focus: vi.fn(), hasAttribute: () => false, tabIndex: 0 } as unknown as HTMLElement;
    const last = { focus: vi.fn(), hasAttribute: () => false, tabIndex: 0 } as unknown as HTMLElement;

    const container = {
      querySelectorAll: () => [first, last],
    } as unknown as HTMLElement;

    const preventDefault = vi.fn();
    handleFocusTrapKeyDown(
      { key: "Tab", shiftKey: false, preventDefault },
      container,
      () => last
    );

    expect(preventDefault).toHaveBeenCalled();
    expect(first.focus).toHaveBeenCalled();
  });

  it("ignores non-Tab keys", () => {
    const preventDefault = vi.fn();
    handleFocusTrapKeyDown(
      { key: "Escape", shiftKey: false, preventDefault },
      { querySelectorAll: () => [] } as unknown as HTMLElement,
      () => null
    );
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
