import {
  loadPeerSettings,
  PEER_RESPONSIBILITY_LABELS,
  type PeerResponsibilityId,
} from "../peer-settings-store";
import type {
  MarketingResponsibility,
  MarketingResponsibilityType,
} from "../domain/marketing-peer-types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

const RESPONSIBILITY_MAP: Record<PeerResponsibilityId, MarketingResponsibilityType> = {
  linkedin: "linkedin",
  instagram: "instagram",
  seo: "seo",
  blogs: "blog",
  email_marketing: "newsletter",
  google_ads: "google_ads",
  meta_ads: "meta_ads",
  landing_pages: "blog",
  newsletters: "newsletter",
};

export type MarketingAutomationViewModel = {
  responsibilities: MarketingResponsibility[];
  emptyMessage: string;
  schedulerMessage: string;
};

function mapResponsibility(
  id: PeerResponsibilityId,
  enabled: boolean,
  input: MarketingPeerDomainInput
): MarketingResponsibility {
  const automation = input.automations.find((a) => a.active);
  const relatedUnits = input.workUnits.filter((u) =>
    u.channel.toLowerCase().includes(id.replace("_", ""))
  );
  const lastUnit = relatedUnits[relatedUnits.length - 1];

  return {
    id,
    type: RESPONSIBILITY_MAP[id],
    label: PEER_RESPONSIBILITY_LABELS[id],
    enabled,
    objective: enabled ? `Keep ${PEER_RESPONSIBILITY_LABELS[id]} on track` : undefined,
    cadence: enabled ? { type: "weekly" } : undefined,
    autonomy: "approval_required",
    limits: {
      maxPostsPerWeek: id === "instagram" || id === "linkedin" ? 5 : undefined,
    },
    status: enabled ? "active" : "paused",
    lastRunAt: lastUnit?.updatedAt,
    nextRunAt: automation?.active ? undefined : undefined,
  };
}

export function buildMarketingAutomationViewModel(
  input: MarketingPeerDomainInput
): MarketingAutomationViewModel {
  const settings = loadPeerSettings(input.peerId);
  const responsibilities = (Object.keys(PEER_RESPONSIBILITY_LABELS) as PeerResponsibilityId[]).map(
    (id) => mapResponsibility(id, settings.responsibilities[id], input)
  );

  return {
    responsibilities,
    emptyMessage: "Configure responsibilities to define what Emma works on autonomously.",
    schedulerMessage:
      "Autonomous scheduling is not active yet. Responsibilities and guardrails are ready for the next sprint.",
  };
}
