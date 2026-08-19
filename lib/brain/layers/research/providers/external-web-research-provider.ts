/**
 * PX-63 — external web research provider.
 * Fetches public HTTP(S) pages for company + competitor URLs with bounded cost.
 */

import type { CompanyGraph } from "../../company/types";
import type { ResearchDomainId } from "../brain-types";
import {
  isAllowedResearchUrl,
  sanitizeExternalTitle,
  sanitizeExternalWebText,
} from "../research-content-sanitizer";
import { resolveResearchRuntimeConfig } from "../research-config";
import type {
  ResearchFetchRequest,
  ResearchProvider,
  ResearchProviderContext,
  ResearchProviderEvidenceItem,
  ResearchProviderResult,
  ResearchSearchRequest,
} from "../research-provider";
import {
  providerSupports,
  rejectUnsupportedCapability,
} from "../research-provider";

export type CampaignResearchTarget = {
  readonly name: string;
  readonly url?: string | null;
  readonly kind: "company_website" | "competitor";
};

const fetchedUrlCache = new Set<string>();

export function resetExternalWebResearchFetchCache(): void {
  fetchedUrlCache.clear();
}

function extractTitleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

async function fetchPageText(url: string): Promise<{ title: string; excerpt: string } | null> {
  const config = resolveResearchRuntimeConfig();
  if (!config.enableExternalFetch || !isAllowedResearchUrl(url)) return null;

  const cacheKey = url.trim().toLowerCase();
  if (fetchedUrlCache.has(cacheKey)) return null;
  fetchedUrlCache.add(cacheKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.fetchTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "PeergentResearchBot/1.0 (+research; no-auto-publish)",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > config.maxResponseBytes) return null;

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const title = sanitizeExternalTitle(extractTitleFromHtml(html));
    const excerpt = sanitizeExternalWebText(html);
    if (!excerpt) return null;

    return { title, excerpt };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function collectResearchTargets(input: {
  companyGraph: CompanyGraph;
  websiteUrl?: string | null;
  competitors?: readonly CampaignResearchTarget[];
}): CampaignResearchTarget[] {
  const targets: CampaignResearchTarget[] = [];
  const seen = new Set<string>();

  const push = (target: CampaignResearchTarget) => {
    const url = target.url?.trim();
    if (!url || !isAllowedResearchUrl(url)) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ ...target, url });
  };

  if (input.websiteUrl) {
    push({ name: "Company website", url: input.websiteUrl, kind: "company_website" });
  }

  for (const source of input.companyGraph.sources) {
    if (source.kind === "website" && source.refId) {
      push({ name: source.label || "Company website", url: source.refId, kind: "company_website" });
    }
  }

  for (const fact of input.companyGraph.facts) {
    const maybeUrl = fact.value.match(/https?:\/\/[^\s,)]+/i)?.[0];
    if (maybeUrl && /competitor/i.test(fact.key + fact.title)) {
      push({ name: fact.title || fact.value, url: maybeUrl, kind: "competitor" });
    }
  }

  for (const competitor of input.competitors ?? []) {
    push({
      name: competitor.name,
      url: competitor.url,
      kind: competitor.kind ?? "competitor",
    });
  }

  return targets.slice(0, resolveResearchRuntimeConfig().maxUrlsPerRun);
}

function evidenceFromFetch(input: {
  url: string;
  title: string;
  excerpt: string;
  subject: string;
  sourceType: "company_website" | "competitor_website";
  capturedAt: string;
}): ResearchProviderEvidenceItem {
  return {
    sourceType: input.sourceType,
    identity: input.url,
    url: input.url,
    label: input.title,
    rawExcerpt: input.excerpt,
    normalizedSummary: `${input.subject}: ${input.excerpt.slice(0, 280)}`,
    directEvidence: true,
    capturedAt: input.capturedAt,
  };
}

export function createExternalWebResearchProvider(): ResearchProvider {
  const providerId = "external_web_fetch";

  const provider: ResearchProvider = {
    id: providerId,
    capabilities: {
      providerId,
      capabilities: ["fetchWebsite", "searchCompetitors", "fetchMarketSignals"],
    },

    async search(
      _request: ResearchSearchRequest,
      _ctx: ResearchProviderContext
    ): Promise<ResearchProviderResult> {
      return rejectUnsupportedCapability(providerId, "searchWeb");
    },

    async fetch(
      request: ResearchFetchRequest,
      _ctx: ResearchProviderContext
    ): Promise<ResearchProviderResult> {
      if (!providerSupports(provider, "fetchWebsite")) {
        return rejectUnsupportedCapability(providerId, "fetchWebsite");
      }

      const page = await fetchPageText(request.url);
      if (!page) {
        return {
          providerId,
          capability: "fetchWebsite",
          success: false,
          items: [],
          requestsUsed: 1,
          pagesUsed: 0,
          costUsed: 1,
          errorCode: "fetch_failed",
        };
      }

      const sourceType =
        request.domain === "competitor" ? ("competitor_website" as const) : ("company_website" as const);

      return {
        providerId,
        capability: "fetchWebsite",
        success: true,
        items: [
          evidenceFromFetch({
            url: request.url,
            title: page.title,
            excerpt: page.excerpt,
            subject: request.domain,
            sourceType,
            capturedAt: new Date().toISOString(),
          }),
        ],
        requestsUsed: 1,
        pagesUsed: 1,
        costUsed: 1,
        errorCode: null,
      };
    },

    async snapshot(_input: {
      target: string;
      domain: ResearchDomainId;
      ctx: ResearchProviderContext;
    }): Promise<ResearchProviderResult> {
      return {
        providerId,
        capability: "fetchMarketSignals",
        success: false,
        items: [],
        requestsUsed: 0,
        pagesUsed: 0,
        costUsed: 0,
        errorCode: "snapshot_not_supported",
      };
    },
  };

  return provider;
}

/** Fetch all campaign research targets within budget — used by research-graph orchestrator. */
export async function fetchExternalResearchTargets(input: {
  companyGraph: CompanyGraph;
  websiteUrl?: string | null;
  competitors?: readonly { name: string; url?: string | null }[];
  organizationId: string;
}): Promise<{
  items: ResearchProviderEvidenceItem[];
  requestsUsed: number;
  pagesUsed: number;
  costUsed: number;
  providerId: string;
  fetchFailures: number;
}> {
  const provider = createExternalWebResearchProvider();
  const config = resolveResearchRuntimeConfig();
  const items: ResearchProviderEvidenceItem[] = [];
  let requestsUsed = 0;
  let pagesUsed = 0;
  let costUsed = 0;
  let fetchFailures = 0;

  if (!config.enableExternalFetch) {
    return { items, requestsUsed, pagesUsed, costUsed, providerId: provider.id, fetchFailures: 0 };
  }

  const targets = collectResearchTargets({
    companyGraph: input.companyGraph,
    websiteUrl: input.websiteUrl,
    competitors: input.competitors?.map((c) => ({
      name: c.name,
      url: c.url,
      kind: "competitor" as const,
    })),
  });

  const ctx: ResearchProviderContext = {
    companyGraph: input.companyGraph,
    organizationId: input.organizationId,
    budgetState: {
      sourcesUsed: 0,
      requestsUsed: 0,
      pagesUsed: 0,
      competitorsUsed: 0,
      durationMs: 0,
      costUsed: 0,
      exhausted: false,
      stopReason: null,
    },
  };

  for (const target of targets) {
    if (requestsUsed >= config.maxUrlsPerRun) break;
    const domain: ResearchDomainId =
      target.kind === "competitor" ? "competitor" : "company_website";
    const result = await provider.fetch!(
      { url: target.url!, domain, organizationId: input.organizationId },
      ctx
    );
    requestsUsed += result.requestsUsed;
    pagesUsed += result.pagesUsed;
    costUsed += result.costUsed;
    if (result.success) {
      items.push(...result.items);
    } else {
      fetchFailures += 1;
    }
  }

  return {
    items,
    requestsUsed,
    pagesUsed,
    costUsed,
    providerId: provider.id,
    fetchFailures,
  };
}
