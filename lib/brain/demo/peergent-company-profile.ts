import type { DemoLocale } from "@/lib/office/demo/demo-company";
import type { CompanyProfile } from "../company/profile";
import { fieldFromValue, fieldFromListValue } from "../company/source-priority";
import { resolveFreshness } from "../domain/freshness";

const DEMO_ORG_ID = "org-demo-peergent";

/** Canonical Peergent demo company profile — org-level, not campaign-specific. */
export function buildPeergentCompanyProfile(
  locale: DemoLocale = "nl",
  assembledAt?: string
): CompanyProfile {
  const nl = locale === "nl";
  const at = assembledAt ?? new Date().toISOString();
  const fresh = resolveFreshness(at, 7 * 24 * 60 * 60 * 1000);

  return {
    organizationId: DEMO_ORG_ID,
    companyName: fieldFromValue("Peergent", "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    industry: fieldFromValue(
      nl ? "AI-werkpleksoftware" : "AI workforce software",
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    website: fieldFromValue("https://peergent.com", "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    products: fieldFromListValue(
      nl
        ? ["Peergent Office", "Peer Studio", "Command Center"]
        : ["Peergent Office", "Peer Studio", "Command Center"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    services: fieldFromListValue(
      nl ? ["AI-collega's voor marketing, sales en support"] : ["AI colleagues for marketing, sales, and support"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    markets: fieldFromListValue(nl ? ["Nederland", "Benelux"] : ["Netherlands", "Benelux"], "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    targetAudiences: fieldFromListValue(
      nl
        ? ["MKB-directeuren", "Operations leads", "Marketing leads"]
        : ["SMB executives", "Operations leads", "Marketing leads"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    uniqueSellingPoints: fieldFromListValue(
      nl
        ? ["AI-collega's die echt meewerken", "Rustige premium werkplek", "Outcome-first"]
        : ["AI colleagues that truly collaborate", "Calm premium workspace", "Outcome-first"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    positioning: fieldFromValue(
      nl
        ? "Peergent is het AI Workforce Operating System voor teams die slimmer willen werken zonder dashboard-chaos."
        : "Peergent is the AI Workforce Operating System for teams that want to work smarter without dashboard chaos.",
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    tone: fieldFromValue(
      nl ? "Rustig, premium, direct — geen SaaS-clichés." : "Calm, premium, direct — no SaaS clichés.",
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    businessModel: fieldFromValue(nl ? "SaaS per organisatie" : "SaaS per organization", "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    regions: fieldFromListValue(["NL", "EU"], "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    languages: fieldFromListValue(["nl", "en"], "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    mission: fieldFromValue(
      nl
        ? "Teams laten werken met AI-collega's die context begrijpen en resultaat leveren."
        : "Help teams work with AI colleagues that understand context and deliver outcomes.",
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    vision: fieldFromValue(
      nl ? "De standaard AI-werkplek voor moderne organisaties." : "The default AI workspace for modern organizations.",
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    customerTypes: fieldFromListValue(
      nl ? ["MKB", "Scale-ups", "Professionele diensten"] : ["SMB", "Scale-ups", "Professional services"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    typicalCustomerSize: fieldFromValue(nl ? "10–200 medewerkers" : "10–200 employees", "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    salesProcess: fieldFromValue(nl ? "Demo → pilot → rollout" : "Demo → pilot → rollout", "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "high",
      customerConfirmed: true,
    }),
    mainCompetitors: fieldFromListValue(
      nl ? ["Generieke AI-assistenten", "Traditionele marketingbureaus"] : ["Generic AI assistants", "Traditional agencies"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "medium", customerConfirmed: true }
    ),
    brandPromises: fieldFromListValue(
      nl ? ["Rust", "Context vóór actie", "Eén primaire actie per scherm"] : ["Calm", "Context before action", "One primary action per screen"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    pricingStyle: fieldFromValue(nl ? "Transparant per organisatie" : "Transparent per organization", "customer_confirmed", {
      lastUpdatedAt: at,
      freshness: fresh,
      confidence: "medium",
      customerConfirmed: true,
    }),
    goals: fieldFromListValue(
      nl ? ["Merkbekendheid", "Demo-aanvragen"] : ["Brand awareness", "Demo requests"],
      "customer_confirmed",
      { lastUpdatedAt: at, freshness: fresh, confidence: "high", customerConfirmed: true }
    ),
    knownLimitations: fieldFromListValue([], "unknown", { lastUpdatedAt: at, freshness: "unknown" }),
    assumptions: fieldFromListValue([], "unknown", { lastUpdatedAt: at, freshness: "unknown" }),
    unknowns: [],
    metadata: { freshness: fresh, lastUpdatedAt: at },
  };
}

import { buildSimulatedWebsiteSnapshot } from "../website/simulated-snapshot";

export const PEERGENT_DEMO_ORG_ID = DEMO_ORG_ID;

export function buildPeergentWebsiteSnapshot(assembledAt?: string) {
  return buildSimulatedWebsiteSnapshot({
    organizationId: DEMO_ORG_ID,
    url: "https://peergent.com",
    companyName: "Peergent",
    assembledAt,
  });
}
