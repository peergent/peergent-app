import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import { deriveProjectStatus } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  sanitizeV17CampaignDisplayName,
  sanitizeV17CustomerLine,
} from "./sanitize-v17-customer-text";

export type PeerWorkBriefingViewModel = {
  peerTagLabel: string;
  focusItalic: string;
  metaLine: string | null;
  headline: string;
  supportingLine: string | null;
};

function primaryProject(input: MarketingPeerDomainInput) {
  const unit =
    input.workUnits.find((u) => u.id === input.activeWorkUnitId) ??
    input.workUnits.find(
      (u) =>
        !u.cancelled &&
        !u.paused &&
        u.status !== "published" &&
        u.status !== "monitoring"
    );
  if (unit?.projectId) {
    return input.projects.find((p) => p.id === unit.projectId) ?? null;
  }
  return (
    input.projects.find((p) => {
      const status = deriveProjectStatus(p, input.workUnits, input.drafts, new Set());
      return !["completed", "archived", "monitoring_results"].includes(status);
    }) ?? null
  );
}

export function buildPeerWorkBriefingViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  peerDisplayName: string;
  locale: MarketingCampaignLocale;
  waitingGroupTitle: string | null;
  waitingGroupContext: string | null;
  waitingItemCount?: number;
  isActivelyWorking: boolean;
}): PeerWorkBriefingViewModel {
  const {
    domainInput,
    peerDisplayName,
    locale,
    waitingGroupTitle,
    waitingGroupContext,
    waitingItemCount,
    isActivelyWorking,
  } = input;
  const project = primaryProject(domainInput);
  const projectName = sanitizeV17CampaignDisplayName(project?.title?.trim() ?? "") || null;

  const focus = resolveMarketingWorkflowFocus({
    generating: domainInput.generating,
    generatingActivity: domainInput.generatingActivity,
    understanding: domainInput.understanding,
    strategy: domainInput.strategy,
    plan: domainInput.plan,
    drafts: domainInput.drafts,
    publicationPackages: domainInput.publicationPackages,
  });

  if (waitingGroupTitle) {
    const action = waitingGroupTitle.toLowerCase();
    const nl = projectName
      ? `De campagneonderdelen staan klaar. Zodra jij ze beoordeelt, kan ik verder met ${projectName}.`
      : `Er staat werk klaar. Zodra jij ${action} hebt gedaan, ga ik verder.`;
    const en = projectName
      ? `Campaign pieces are ready. Once you review them, I'll continue on ${projectName}.`
      : `Work is waiting. Once you've ${action}, I'll continue.`;
    const supporting =
      waitingItemCount && waitingItemCount > 0
        ? locale === "nl"
          ? `${waitingItemCount} onderdelen wachten op jouw beoordeling.`
          : `${waitingItemCount} items waiting for your review.`
        : waitingGroupContext
          ? sanitizeV17CustomerLine(waitingGroupContext, locale) || null
          : null;
    return {
      peerTagLabel: peerDisplayName,
      focusItalic: locale === "nl" ? nl : en,
      metaLine: null,
      headline: locale === "nl" ? nl : en,
      supportingLine: supporting,
    };
  }

  if (isActivelyWorking && projectName) {
    const nl = `Focus ligt bij ${projectName}. Ik bereid de volgende onderdelen voor.`;
    const en = `Focus is on ${projectName}. I'm preparing the next pieces.`;
    return {
      peerTagLabel: peerDisplayName,
      focusItalic: locale === "nl" ? nl : en,
      metaLine: null,
      headline: locale === "nl" ? nl : en,
      supportingLine:
        locale === "nl"
          ? "Je hoort van me zodra de volgende versie klaarstaat."
          : "I'll reach out when the next version is ready.",
    };
  }

  if (focus.kind === "knowledge_incomplete") {
    const nl =
      "Ik heb nog wat bedrijfscontext nodig voordat ik zelfverzekerd verder kan.";
    const en = "I need a bit more business context before I can continue confidently.";
    return {
      peerTagLabel: peerDisplayName,
      focusItalic: locale === "nl" ? nl : en,
      metaLine: null,
      headline: locale === "nl" ? nl : en,
      supportingLine: null,
    };
  }

  const nlCaught = "Alles wat voor vandaag gepland stond, is afgerond.";
  const enCaught = "Everything planned for today is complete.";
  return {
    peerTagLabel: peerDisplayName,
    focusItalic: locale === "nl" ? nlCaught : enCaught,
    metaLine: null,
    headline: locale === "nl" ? nlCaught : enCaught,
    supportingLine: null,
  };
}

export function sanitizePulseDetail(detail: string, locale: MarketingCampaignLocale): string {
  return sanitizeV17CustomerLine(detail, locale);
}
