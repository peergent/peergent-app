/**
 * @deprecated Superseded by lib/peer-experience (Sprint 11). Retained for legacy tests only.
 */
export type CurrentFocus = {
  headline: string;
  detail: string;
};

export type FocusInput = {
  generating: "understanding" | "strategy" | "plan" | "draft" | "publication" | null;
  generatingActivity?: string | null;
  pendingDraftTitle?: string;
  planActivityReference?: string;
  nextScheduledActivityTitle?: string;
  nextScheduledActivityWeek?: number;
  readyToPublishDraftTitle?: string;
  approvedDraftTitle?: string;
  undraftedActivityCount?: number;
  planComplete?: boolean;
};

export function deriveCurrentFocus(input: FocusInput): CurrentFocus {
  if (input.generating) {
    return {
      headline: `[legacy] generating:${input.generating}`,
      detail: input.generatingActivity ?? "",
    };
  }

  if (input.pendingDraftTitle) {
    return {
      headline: `[legacy] pending:${input.pendingDraftTitle}`,
      detail: "",
    };
  }

  if (input.readyToPublishDraftTitle) {
    return {
      headline: `[legacy] ready_to_publish:${input.readyToPublishDraftTitle}`,
      detail: "",
    };
  }

  if (input.approvedDraftTitle) {
    return {
      headline: `[legacy] approved:${input.approvedDraftTitle}`,
      detail: "",
    };
  }

  if (input.nextScheduledActivityTitle) {
    return {
      headline: `[legacy] next:${input.nextScheduledActivityTitle}`,
      detail: "",
    };
  }

  if (input.planComplete) {
    return {
      headline: "[legacy] plan_complete",
      detail: "",
    };
  }

  if ((input.undraftedActivityCount ?? 0) > 0) {
    return {
      headline: `[legacy] undrafted:${input.undraftedActivityCount}`,
      detail: "",
    };
  }

  return {
    headline: "[legacy] monitoring",
    detail: "",
  };
}
