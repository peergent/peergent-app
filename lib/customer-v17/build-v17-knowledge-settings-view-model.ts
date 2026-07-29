import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import { buildMarketingBrainInsights } from "@/lib/peer-experience/marketing/view-models/build-marketing-brain-insights";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  buildMarketingSkillsList,
  websiteScanHref,
} from "@/features/marketing-workspace/lib/build-knowledge-items";

export type V17KnowledgeInsightCard = {
  id: string;
  title: string;
  observation: string;
  recommendation: string | null;
};

export type V17KnowledgeSettingsViewModel = {
  websiteTitle: string;
  websiteDescription: string;
  websiteCta: string;
  websiteHref: string;
  insightsTitle: string;
  insights: V17KnowledgeInsightCard[];
  insightsEmpty: string;
  skillsTitle: string;
  skills: string[];
  skillsEmpty: string;
};

export function buildV17KnowledgeSettingsViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
}): V17KnowledgeSettingsViewModel {
  const locale = resolveCustomerLocalePreference(input.localePreference) as MarketingCampaignLocale;
  const insights = buildMarketingBrainInsights(input.domainInput);
  const skills = buildMarketingSkillsList(input.domainInput);
  const nl = locale === "nl";

  return {
    websiteTitle: nl ? "Websitekennis" : "Website knowledge",
    websiteDescription: nl
      ? "Scan je website om merk- en productcontext te verrijken."
      : "Scan your website to enrich brand and product context.",
    websiteCta: nl ? "Website scannen" : "Scan website",
    websiteHref: websiteScanHref(input.domainInput.peerId),
    insightsTitle: nl ? "Strategische inzichten" : "Strategic insights",
    insights: insights.slice(0, 3).map((i) => ({
      id: i.id,
      title: i.title,
      observation: i.observation,
      recommendation: i.recommendation?.summary ?? null,
    })),
    insightsEmpty: nl
      ? "Inzichten verschijnen zodra kanalen en kennis zijn gekoppeld."
      : "Insights appear once channels and knowledge are connected.",
    skillsTitle: nl ? "Vaardigheden" : "Skills",
    skills: skills.map((s) => s.label),
    skillsEmpty: nl ? "Nog geen vaardigheden geregistreerd." : "No skills registered yet.",
  };
}
