import type { HandoffState } from "@/lib/home/handoff-types";
import type { HomeCopy } from "@/lib/i18n";
import type { HomeMorningNarrative, HomeViewModel } from "@/lib/home";
import type { BriefingDecisionProps } from "@/components/workforce/types";

export function narrativeForBriefing(
  viewModel: HomeViewModel | null,
  handoff: HandoffState
): HomeMorningNarrative {
  if (viewModel) {
    return viewModel.narrative;
  }

  const detail =
    handoff.briefingLines.filter(Boolean).join(" ") || handoff.waitLine || undefined;

  return {
    greeting: handoff.personalGreeting,
    headline: handoff.headline,
    detail,
  };
}

export function decisionForBriefing(
  viewModel: HomeViewModel | null,
  handoff: HandoffState,
  copy: HomeCopy
): BriefingDecisionProps | null {
  const topNeed = viewModel?.needsYou[0];
  const primaryWork = handoff.primaryWork;

  if (topNeed) {
    const needCount = viewModel?.needsYou.length ?? 1;
    if (needCount === 1) {
      return {
        title: copy.ui.decisionSingleMorning,
        href: topNeed.href,
        ctaLabel: topNeed.title,
      };
    }

    return {
      title: copy.needsYou,
      href: "/inbox",
      ctaLabel: copy.needsYouViewAll,
    };
  }

  if (primaryWork) {
    return {
      title: copy.ui.decisionSingleMorning,
      href: primaryWork.destination,
      ctaLabel: primaryWork.title,
    };
  }

  if (viewModel?.suggestedStart) {
    return {
      title: viewModel.suggestedStart.headline,
      href: viewModel.suggestedStart.href,
      ctaLabel: viewModel.suggestedStart.ctaLabel,
    };
  }

  return null;
}
