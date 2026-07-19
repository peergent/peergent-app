import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";

export type OnboardingStepId =
  | "welcome"
  | "review-understanding"
  | "generate-strategy"
  | "create-plan"
  | "create-draft"
  | "approve-draft"
  | "complete";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  isComplete: boolean;
  isCurrent: boolean;
};

export function deriveOnboardingSteps(input: {
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
}): OnboardingStep[] {
  const hasApprovedDraft = input.drafts.some((d) => d.status === "approved");
  const hasDraft = input.drafts.length > 0;
  const hasPendingDraft = input.drafts.some(
    (d) => d.status === "draft" || d.status === "ready_for_review"
  );

  const milestones = [
    {
      id: "review-understanding" as const,
      title: "Review what I know",
      description:
        "Check marketing understanding so we start from accurate business context.",
      done: Boolean(input.understanding?.available && input.understanding.completeness >= 40),
    },
    {
      id: "generate-strategy" as const,
      title: "Generate marketing strategy",
      description: "I'll draft a strategy grounded in your business knowledge.",
      done: Boolean(input.strategy),
    },
    {
      id: "create-plan" as const,
      title: "Create execution plan",
      description: "Turn the strategy into a timeline and content calendar.",
      done: Boolean(input.plan),
    },
    {
      id: "create-draft" as const,
      title: "Create your first content draft",
      description: "Pick a calendar slot and I'll draft content for your review.",
      done: hasDraft,
    },
    {
      id: "approve-draft" as const,
      title: "Approve a draft",
      description: "Review the draft and approve it — nothing is published automatically.",
      done: hasApprovedDraft,
    },
  ];

  const totalSteps = milestones.length;
  let currentIndex = milestones.findIndex((m) => !m.done);
  if (currentIndex === -1) currentIndex = totalSteps - 1;

  // If draft exists but pending, stay on approve step
  if (hasPendingDraft && !hasApprovedDraft) {
    currentIndex = milestones.findIndex((m) => m.id === "approve-draft");
  }

  return milestones.map((m, index) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    stepNumber: index + 1,
    totalSteps,
    isComplete: m.done,
    isCurrent: index === currentIndex && !hasApprovedDraft,
  }));
}

export function isOnboardingActive(steps: OnboardingStep[]): boolean {
  return steps.some((s) => s.isCurrent && s.id !== "complete");
}
