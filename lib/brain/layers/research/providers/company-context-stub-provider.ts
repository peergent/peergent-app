/**
 * Stub Research Provider — derives evidence from CompanyGraph only.
 * No external API calls, no fabrication.
 */

import type { CompanyGraph } from "../../company/types";
import type { ResearchProviderEvidenceItem } from "../research-provider";
import {
  providerSupports,
  rejectUnsupportedCapability,
  type ResearchFetchRequest,
  type ResearchProvider,
  type ResearchProviderContext,
  type ResearchProviderResult,
  type ResearchSearchRequest,
} from "../research-provider";

function factsByDomain(graph: CompanyGraph, domain: string) {
  return graph.facts.filter((f) => f.domain === domain);
}

function companyEvidenceFromGraph(
  graph: CompanyGraph,
  capturedAt: string
): ResearchProviderEvidenceItem[] {
  const items: ResearchProviderEvidenceItem[] = [];

  for (const fact of graph.facts) {
    items.push({
      sourceType: "company_graph",
      identity: fact.id,
      url: null,
      label: fact.title,
      rawExcerpt: fact.value,
      normalizedSummary: `${fact.title}: ${fact.value}`,
      directEvidence: fact.customerConfirmed,
      capturedAt: fact.updatedAt || capturedAt,
    });
  }

  for (const source of graph.sources) {
    items.push({
      sourceType: source.kind === "website" ? "company_website" : "knowledge_source",
      identity: source.id,
      url: source.kind === "website" ? source.refId : null,
      label: source.label,
      rawExcerpt: source.refId,
      normalizedSummary: source.label,
      directEvidence: true,
      capturedAt: source.capturedAt,
    });
  }

  return items;
}

function competitorEvidenceFromGraph(
  graph: CompanyGraph,
  capturedAt: string
): ResearchProviderEvidenceItem[] {
  const competitorFacts = graph.facts.filter(
    (f) =>
      f.domain === "competitive_position" ||
      f.key.includes("competitor") ||
      /competitor/i.test(f.title)
  );

  return competitorFacts.map((fact) => ({
    sourceType: "company_graph" as const,
    identity: fact.id,
    url: null,
    label: fact.title,
    rawExcerpt: fact.value,
    normalizedSummary: fact.value,
    directEvidence: fact.customerConfirmed,
    capturedAt: fact.updatedAt || capturedAt,
  }));
}

export function createCompanyContextStubProvider(): ResearchProvider {
  const providerId = "company_context_stub";

  const provider: ResearchProvider = {
    id: providerId,
    capabilities: {
      providerId,
      capabilities: ["fetchWebsite", "searchCompetitors", "fetchMarketSignals"],
    },

    async search(
      request: ResearchSearchRequest,
      ctx: ResearchProviderContext
    ): Promise<ResearchProviderResult> {
      if (!providerSupports(provider, "searchWeb")) {
        return rejectUnsupportedCapability(providerId, "searchWeb");
      }
      return rejectUnsupportedCapability(providerId, "searchWeb");
    },

    async fetch(
      request: ResearchFetchRequest,
      ctx: ResearchProviderContext
    ): Promise<ResearchProviderResult> {
      if (!providerSupports(provider, "fetchWebsite")) {
        return rejectUnsupportedCapability(providerId, "fetchWebsite");
      }

      const websiteFacts = factsByDomain(ctx.companyGraph, "website");
      const items: ResearchProviderEvidenceItem[] = websiteFacts.map((fact) => ({
        sourceType: "company_website",
        identity: fact.id,
        url: request.url,
        label: fact.title,
        rawExcerpt: fact.value,
        normalizedSummary: fact.value,
        directEvidence: fact.customerConfirmed,
        capturedAt: fact.updatedAt,
      }));

      if (items.length === 0) {
        const sources = ctx.companyGraph.sources.filter((s) => s.kind === "website");
        for (const source of sources) {
          items.push({
            sourceType: "company_website",
            identity: source.id,
            url: request.url,
            label: source.label,
            rawExcerpt: source.refId,
            normalizedSummary: `Website reference: ${source.label}`,
            directEvidence: true,
            capturedAt: source.capturedAt,
          });
        }
      }

      return {
        providerId,
        capability: "fetchWebsite",
        success: items.length > 0,
        items,
        requestsUsed: 1,
        pagesUsed: items.length > 0 ? 1 : 0,
        costUsed: 1,
        errorCode: items.length === 0 ? "no_website_evidence" : null,
      };
    },

    async snapshot(input: {
      target: string;
      domain: import("../brain-types").ResearchDomainId;
      ctx: ResearchProviderContext;
    }): Promise<ResearchProviderResult> {
      const capturedAt = new Date().toISOString();
      let items: ResearchProviderEvidenceItem[] = [];

      if (input.domain === "competitor") {
        items = competitorEvidenceFromGraph(input.ctx.companyGraph, capturedAt);
      } else if (input.domain === "market" || input.domain === "industry") {
        items = factsByDomain(input.ctx.companyGraph, "industry").map((fact) => ({
          sourceType: "company_graph" as const,
          identity: fact.id,
          url: null,
          label: fact.title,
          rawExcerpt: fact.value,
          normalizedSummary: fact.value,
          directEvidence: fact.customerConfirmed,
          capturedAt: fact.updatedAt || capturedAt,
        }));
      } else {
        items = companyEvidenceFromGraph(input.ctx.companyGraph, capturedAt).slice(0, 10);
      }

      const capability =
        input.domain === "competitor"
          ? "searchCompetitors"
          : input.domain === "market" || input.domain === "industry"
            ? "fetchMarketSignals"
            : "fetchWebsite";

      if (!providerSupports(provider, capability)) {
        return rejectUnsupportedCapability(providerId, capability);
      }

      return {
        providerId,
        capability,
        success: items.length > 0,
        items,
        requestsUsed: 1,
        pagesUsed: 0,
        costUsed: 1,
        errorCode: items.length === 0 ? "no_evidence_available" : null,
      };
    },
  };

  return provider;
}
