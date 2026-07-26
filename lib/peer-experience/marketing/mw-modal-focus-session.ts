/** Guards initial dialog focus so it runs once per open — not on parent re-renders. */
export function createModalFocusSession() {
  let openSession = false;
  let initialFocusDone = false;

  return {
    markOpened() {
      if (!openSession) {
        openSession = true;
        initialFocusDone = false;
      }
    },
    markClosed() {
      openSession = false;
      initialFocusDone = false;
    },
    shouldApplyInitialFocus(): boolean {
      if (!openSession || initialFocusDone) {
        return false;
      }
      initialFocusDone = true;
      return true;
    },
  };
}

export const MODAL_INITIAL_FOCUS_SELECTOR =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not(.mw-modal-close):not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function findModalInitialFocusTarget(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>(MODAL_INITIAL_FOCUS_SELECTOR);
}
