import {
  resolveMarketingCampaignLocale,
  type MarketingCampaignLocale,
} from "./marketing-campaign-copy";

export type V17ReviewModalCopy = {
  approveTitle: (artifactTypeLabel: string) => string;
  approveBody: string;
  approveNote: string;
  approveConfirm: string;
  cancel: string;
  requestChangesTitle: string;
  requestChangesSubtitle: string;
  requestChangesSubmit: string;
  rejectTitle: string;
  rejectSubtitle: string;
  rejectSubmit: string;
  closeAria: string;
};

function approveTitleNl(artifactTypeLabel: string): string {
  const lower = artifactTypeLabel.toLowerCase();
  if (lower.includes("strateg")) return "Campagnestrategie goedkeuren?";
  if (lower.includes("creatief") || lower.includes("creative")) return "Creatieve richting goedkeuren?";
  if (lower.includes("linkedin")) return "LinkedIn-bericht goedkeuren?";
  if (lower.includes("e-mail") || lower.includes("email")) return "E-mailcampagne goedkeuren?";
  return `${artifactTypeLabel} goedkeuren?`;
}

function approveTitleEn(artifactTypeLabel: string): string {
  const lower = artifactTypeLabel.toLowerCase();
  if (lower.includes("strategy")) return "Approve this strategy?";
  if (lower.includes("creative")) return "Approve this creative direction?";
  if (lower.includes("linkedin")) return "Approve this LinkedIn post?";
  if (lower.includes("email")) return "Approve this email campaign?";
  return `Approve ${artifactTypeLabel}?`;
}

const nl: V17ReviewModalCopy = {
  approveTitle: approveTitleNl,
  approveBody: "Marketing Peer gaat daarna verder met de volgende campagneonderdelen.",
  approveNote:
    "Je kunt eerdere beslissingen later terugvinden in de geschiedenis.",
  approveConfirm: "Goedkeuren",
  cancel: "Annuleren",
  requestChangesTitle: "Wijzigingen vragen",
  requestChangesSubtitle: "Vertel Marketing Peer wat je anders wilt.",
  requestChangesSubmit: "Feedback versturen",
  rejectTitle: "Onderdeel afwijzen",
  rejectSubtitle:
    "Afwijzen stopt de voortgang. Marketing Peer wacht tot je een nieuwe revisie start.",
  rejectSubmit: "Afwijzen",
  closeAria: "Sluiten",
};

const en: V17ReviewModalCopy = {
  approveTitle: approveTitleEn,
  approveBody: "Marketing Peer will continue with the next campaign deliverables.",
  approveNote: "You can revisit past decisions in history when available.",
  approveConfirm: "Approve",
  cancel: "Cancel",
  requestChangesTitle: "Request changes",
  requestChangesSubtitle: "Tell Marketing Peer what you would like changed.",
  requestChangesSubmit: "Submit feedback",
  rejectTitle: "Reject this item",
  rejectSubtitle:
    "Rejecting stops campaign progress. Marketing Peer will wait until you start a new revision.",
  rejectSubmit: "Reject item",
  closeAria: "Close",
};

export function getV17ReviewModalCopy(
  localePreference?: string | null
): V17ReviewModalCopy {
  const locale = resolveMarketingCampaignLocale(localePreference);
  return locale === "nl" ? nl : en;
}

export function v17ReviewModalLocale(
  localePreference?: string | null
): MarketingCampaignLocale {
  return resolveMarketingCampaignLocale(localePreference);
}
