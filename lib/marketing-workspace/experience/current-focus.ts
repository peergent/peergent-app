export type CurrentFocus = {
  headline: string;
  detail: string;
};

export type FocusInput = {
  generating: "understanding" | "strategy" | "plan" | "draft" | null;
  generatingActivity?: string | null;
  pendingDraftTitle?: string;
  planActivityReference?: string;
};

export function deriveCurrentFocus(input: FocusInput): CurrentFocus {
  if (input.generating === "understanding") {
    return {
      headline: "I'm currently learning about your business.",
      detail: "Reviewing marketing understanding from Company DNA and Business Brain.",
    };
  }

  if (input.generating === "strategy") {
    return {
      headline: "I'm currently updating the marketing strategy.",
      detail: "Turning verified understanding into positioning and audience recommendations.",
    };
  }

  if (input.generating === "plan") {
    return {
      headline: "I'm currently building the content calendar.",
      detail: "Transforming the approved strategy into a timeline and planned activities.",
    };
  }

  if (input.generating === "draft") {
    const activity = input.generatingActivity ?? input.planActivityReference ?? "content";
    return {
      headline: `I'm currently creating a draft for "${activity}".`,
      detail: "Drafting from the marketing plan — this won't be published until you approve it.",
    };
  }

  if (input.pendingDraftTitle) {
    return {
      headline: "I'm waiting for your approval.",
      detail: `Review the draft "${input.pendingDraftTitle}" so I can continue.`,
    };
  }

  return {
    headline: "I'm ready for your direction.",
    detail: "Tell me what to focus on, or follow a recommendation below.",
  };
}
