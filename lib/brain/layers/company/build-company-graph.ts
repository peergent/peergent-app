import type { CompanySnapshot } from "../../company/snapshot";
import type { CompanyProfileField } from "../../company/source-priority";
import type { BrandGraph } from "../brand/types";
import { COMPANY_DOMAIN_SPECS } from "./modules/specs";
import {
  createFact,
  evidenceFromSource,
  listFacts,
  profileConfidence,
  profileFreshness,
} from "./company-graph";
import { buildCompanyRelations } from "./company-relations";
import { createCompanyVersion, nextCompanyVersion } from "./company-versioning";
import type {
  CompanyBrainInput,
  CompanyDomainId,
  CompanyFact,
  CompanyGraph,
  CompanyKnowledgeSource,
  CompanyNode,
} from "./types";
import { COMPANY_LAYER_VERSION } from "./types";

function uid(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

function defaultSources(input: CompanyBrainInput, at: string): CompanyKnowledgeSource[] {
  const sources: CompanyKnowledgeSource[] = [
    {
      id: "src-business-profile",
      kind: "business_profile",
      refId: input.organizationId,
      label: "Business profile",
      capturedAt: at,
    },
  ];

  if (input.companySnapshot.website) {
    sources.push({
      id: "src-website",
      kind: "website",
      refId: input.companySnapshot.website.source.url,
      label: "Website metadata",
      capturedAt: input.companySnapshot.website.source.capturedAt ?? at,
    });
  }

  if (input.brandGraph) {
    sources.push({
      id: "src-brandbook",
      kind: "brandbook",
      refId: `brand:${input.organizationId}`,
      label: "Brand graph",
      capturedAt: input.brandGraph.collectedAt,
    });
  }

  for (const src of input.knowledgeSources ?? []) {
    sources.push(src);
  }

  return sources;
}

function sourceByKind(sources: readonly CompanyKnowledgeSource[], kind: CompanyKnowledgeSource["kind"]) {
  return sources.find((s) => s.kind === kind) ?? sources[0]!;
}

function scalarFact(
  profileSource: CompanyKnowledgeSource,
  field: CompanyProfileField<string | null>,
  domain: CompanyDomainId,
  key: string,
  title: string,
  at: string,
  index: number
): CompanyFact | null {
  if (!field.value?.trim()) return null;
  return createFact({
    id: uid("cf", index),
    domain,
    key,
    title,
    value: field.value,
    sourceIds: [profileSource.id],
    evidence: [evidenceFromSource(profileSource, field.value, index)],
    confidence: profileConfidence(field),
    freshness: profileFreshness(field),
    customerConfirmed: field.customerConfirmed,
    at,
    lastValidated: field.customerConfirmed ? field.lastUpdatedAt ?? at : null,
  });
}

function extractProfileFacts(
  snapshot: CompanySnapshot,
  profileSource: CompanyKnowledgeSource,
  at: string
): CompanyFact[] {
  const p = snapshot.profile;
  let i = 0;
  const facts: CompanyFact[] = [];

  const scalars: Array<[CompanyDomainId, string, string, CompanyProfileField<string | null>]> = [
    ["organization", "company_name", "Company name", p.companyName],
    ["business", "business_model", "Business model", p.businessModel],
    ["industry", "industry", "Industry", p.industry],
    ["mission", "mission", "Mission", p.mission],
    ["vision", "vision", "Vision", p.vision],
    ["competitive_position", "positioning", "Positioning", p.positioning],
    ["tone_of_voice", "tone", "Tone of voice", p.tone],
    ["differentiators", "sales_process", "Sales process", p.salesProcess],
  ];

  for (const [domain, key, title, field] of scalars) {
    const fact = scalarFact(profileSource, field, domain, key, title, at, i++);
    if (fact) facts.push(fact);
  }

  if (p.website.value) {
    facts.push(
      createFact({
        id: uid("cf", i++),
        domain: "website",
        key: "website_url",
        title: "Website URL",
        value: p.website.value,
        sourceIds: [profileSource.id],
        evidence: [evidenceFromSource(profileSource, p.website.value, i)],
        confidence: profileConfidence(p.website),
        freshness: profileFreshness(p.website),
        customerConfirmed: p.website.customerConfirmed,
        at,
      })
    );
  }

  facts.push(
    ...listFacts(p.products.value ?? [], {
      domain: "products",
      keyPrefix: "product",
      titlePrefix: "Product",
      source: profileSource,
      confidence: profileConfidence(p.products),
      freshness: profileFreshness(p.products),
      customerConfirmed: p.products.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.products.value?.length ?? 0;

  facts.push(
    ...listFacts(p.services.value ?? [], {
      domain: "services",
      keyPrefix: "service",
      titlePrefix: "Service",
      source: profileSource,
      confidence: profileConfidence(p.services),
      freshness: profileFreshness(p.services),
      customerConfirmed: p.services.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.services.value?.length ?? 0;

  facts.push(
    ...listFacts(p.targetAudiences.value ?? [], {
      domain: "audience",
      keyPrefix: "audience",
      titlePrefix: "Audience",
      source: profileSource,
      confidence: profileConfidence(p.targetAudiences),
      freshness: profileFreshness(p.targetAudiences),
      customerConfirmed: p.targetAudiences.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.targetAudiences.value?.length ?? 0;

  facts.push(
    ...listFacts(p.customerTypes.value ?? [], {
      domain: "ideal_customers",
      keyPrefix: "customer_type",
      titlePrefix: "Customer type",
      source: profileSource,
      confidence: profileConfidence(p.customerTypes),
      freshness: profileFreshness(p.customerTypes),
      customerConfirmed: p.customerTypes.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.customerTypes.value?.length ?? 0;

  if (p.typicalCustomerSize.value) {
    const fact = scalarFact(
      profileSource,
      p.typicalCustomerSize,
      "ideal_customers",
      "typical_customer_size",
      "Typical customer size",
      at,
      i++
    );
    if (fact) facts.push(fact);
  }

  facts.push(
    ...listFacts(p.markets.value ?? [], {
      domain: "markets",
      keyPrefix: "market",
      titlePrefix: "Market",
      source: profileSource,
      confidence: profileConfidence(p.markets),
      freshness: profileFreshness(p.markets),
      customerConfirmed: p.markets.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.markets.value?.length ?? 0;

  facts.push(
    ...listFacts(p.regions.value ?? [], {
      domain: "locations",
      keyPrefix: "region",
      titlePrefix: "Region",
      source: profileSource,
      confidence: profileConfidence(p.regions),
      freshness: profileFreshness(p.regions),
      customerConfirmed: p.regions.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.regions.value?.length ?? 0;

  facts.push(
    ...listFacts(p.languages.value ?? [], {
      domain: "languages",
      keyPrefix: "language",
      titlePrefix: "Language",
      source: profileSource,
      confidence: profileConfidence(p.languages),
      freshness: profileFreshness(p.languages),
      customerConfirmed: p.languages.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.languages.value?.length ?? 0;

  facts.push(
    ...listFacts(p.uniqueSellingPoints.value ?? [], {
      domain: "usps",
      keyPrefix: "usp",
      titlePrefix: "USP",
      source: profileSource,
      confidence: profileConfidence(p.uniqueSellingPoints),
      freshness: profileFreshness(p.uniqueSellingPoints),
      customerConfirmed: p.uniqueSellingPoints.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.uniqueSellingPoints.value?.length ?? 0;

  facts.push(
    ...listFacts(p.goals.value ?? [], {
      domain: "business_goals",
      keyPrefix: "goal",
      titlePrefix: "Business goal",
      source: profileSource,
      confidence: profileConfidence(p.goals),
      freshness: profileFreshness(p.goals),
      customerConfirmed: p.goals.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.goals.value?.length ?? 0;

  facts.push(
    ...listFacts(p.brandPromises.value ?? [], {
      domain: "core_values",
      keyPrefix: "value",
      titlePrefix: "Brand promise",
      source: profileSource,
      confidence: profileConfidence(p.brandPromises),
      freshness: profileFreshness(p.brandPromises),
      customerConfirmed: p.brandPromises.customerConfirmed,
      at,
      startIndex: i,
    })
  );
  i += p.brandPromises.value?.length ?? 0;

  facts.push(
    ...listFacts(p.knownLimitations.value ?? [], {
      domain: "policies",
      keyPrefix: "policy",
      titlePrefix: "Known limitation",
      source: profileSource,
      confidence: profileConfidence(p.knownLimitations),
      freshness: profileFreshness(p.knownLimitations),
      customerConfirmed: p.knownLimitations.customerConfirmed,
      at,
      startIndex: i,
    })
  );

  return facts;
}

function extractBrandFacts(brand: BrandGraph, brandSource: CompanyKnowledgeSource, at: string): CompanyFact[] {
  const facts: CompanyFact[] = [];
  let i = 0;

  const domainMap: Partial<Record<string, CompanyDomainId>> = {
    tone_of_voice: "tone_of_voice",
    writing_style: "writing_style",
    brand_rules: "brand_rules",
    visual_identity: "visual_identity",
    mission: "mission",
    vision: "vision",
    values: "core_values",
    messaging: "brand",
  };

  for (const fact of brand.model.facts) {
    const domain = domainMap[fact.concept] ?? "brand";
    facts.push(
      createFact({
        id: uid("cbf", i++),
        domain,
        key: `brand_${fact.concept}`,
        title: fact.label,
        value: fact.value,
        sourceIds: [brandSource.id],
        evidence: [
          {
            id: `cev-brand-${i}`,
            sourceId: brandSource.id,
            summary: fact.value,
            capturedAt: fact.collectedAt,
          },
        ],
        confidence: fact.confidence >= 0.8 ? "high" : fact.confidence >= 0.5 ? "medium" : "low",
        freshness: "fresh",
        customerConfirmed: fact.knowledgeStatus === "validated",
        at,
        lastValidated: fact.knowledgeStatus === "validated" ? fact.collectedAt : null,
      })
    );
  }

  return facts;
}

function extractWebsiteMetadataFacts(
  snapshot: CompanySnapshot,
  websiteSource: CompanyKnowledgeSource,
  at: string
): CompanyFact[] {
  const website = snapshot.website;
  if (!website) return [];
  const facts: CompanyFact[] = [];
  let i = 0;

  if (website.metadata.title) {
    facts.push(
      createFact({
        id: uid("cwf", i++),
        domain: "website",
        key: "site_title",
        title: "Website title",
        value: website.metadata.title,
        sourceIds: [websiteSource.id],
        evidence: [evidenceFromSource(websiteSource, website.metadata.title, i)],
        confidence: "medium",
        freshness: "fresh",
        customerConfirmed: false,
        at,
      })
    );
  }

  if (website.metadata.description) {
    facts.push(
      createFact({
        id: uid("cwf", i++),
        domain: "website",
        key: "site_description",
        title: "Website description",
        value: website.metadata.description,
        sourceIds: [websiteSource.id],
        evidence: [evidenceFromSource(websiteSource, website.metadata.description, i)],
        confidence: "medium",
        freshness: "fresh",
        customerConfirmed: false,
        at,
      })
    );
  }

  return facts;
}

function extractIntegrationFacts(
  integrations: CompanyBrainInput["integrations"],
  source: CompanyKnowledgeSource,
  at: string
): CompanyFact[] {
  if (!integrations?.length) return [];
  return integrations.map((item, i) =>
    createFact({
      id: `cint-${i}`,
      domain: "integrations",
      key: item.id,
      title: `Integration: ${item.provider}`,
      value: `${item.provider} (${item.status})`,
      sourceIds: [source.id],
      evidence: [
        {
          id: `cev-int-${i}`,
          sourceId: source.id,
          summary: item.configRef,
          capturedAt: at,
        },
      ],
      confidence: "high",
      freshness: "fresh",
      customerConfirmed: true,
      at,
    })
  );
}

function buildNodes(facts: readonly CompanyFact[]): CompanyNode[] {
  return COMPANY_DOMAIN_SPECS.map((spec) => ({
    id: `cnode-${spec.id}`,
    domain: spec.id,
    label: spec.title,
    factIds: facts.filter((f) => f.domain === spec.id).map((f) => f.id),
    layerOrder: spec.layerOrder,
  })).filter((n) => n.factIds.length > 0);
}

function overallConfidence(facts: readonly CompanyFact[]): import("./types").CompanyConfidence {
  if (facts.length === 0) return "low";
  const high = facts.filter((f) => f.confidence === "high").length;
  const ratio = high / facts.length;
  if (ratio >= 0.6) return "high";
  if (ratio >= 0.3) return "medium";
  return "low";
}

/** Build CompanyGraph from customer-supplied inputs — never crawls or fabricates. */
export function buildCompanyGraph(
  input: CompanyBrainInput,
  priorVersion?: number
): CompanyGraph {
  const at = input.companySnapshot.assembledAt ?? new Date().toISOString();
  const sources = defaultSources(input, at);
  const profileSource = sourceByKind(sources, "business_profile");
  const brandSource = sources.find((s) => s.kind === "brandbook");
  const websiteSource = sources.find((s) => s.kind === "website");

  const facts: CompanyFact[] = [
    ...extractProfileFacts(input.companySnapshot, profileSource, at),
  ];

  if (input.brandGraph && brandSource) {
    facts.push(...extractBrandFacts(input.brandGraph, brandSource, at));
  }

  if (websiteSource) {
    facts.push(...extractWebsiteMetadataFacts(input.companySnapshot, websiteSource, at));
  }

  const configSource: CompanyKnowledgeSource = {
    id: "src-customer-config",
    kind: "customer_configuration",
    refId: input.organizationId,
    label: "Customer configuration",
    capturedAt: at,
  };
  if (input.integrations?.length) {
    sources.push(configSource);
  }
  facts.push(...extractIntegrationFacts(input.integrations, configSource, at));

  for (const src of input.knowledgeSources ?? []) {
    facts.push(
      createFact({
        id: `cks-${src.id}`,
        domain: "knowledge_sources",
        key: src.id,
        title: src.label,
        value: src.refId,
        sourceIds: [src.id],
        evidence: [evidenceFromSource(src, src.label, 0)],
        confidence: "high",
        freshness: "fresh",
        customerConfirmed: true,
        at,
      })
    );
  }

  const nodes = buildNodes(facts);
  const relations = buildCompanyRelations(facts);
  const versionNumber = nextCompanyVersion(priorVersion);

  const populatedDomains = new Set(facts.map((f) => f.domain));
  const unknownDomains = COMPANY_DOMAIN_SPECS.filter((s) => !populatedDomains.has(s.id)).map(
    (s) => s.id
  );

  return {
    version: COMPANY_LAYER_VERSION,
    organizationId: input.organizationId,
    createdAt: at,
    updatedAt: at,
    versionMeta: createCompanyVersion({
      version: versionNumber,
      author: input.author ?? "system",
      source: "company_brain",
      changeReason: input.changeReason ?? "Company graph assembled from supplied sources.",
      at,
    }),
    sources,
    facts,
    nodes,
    relations,
    confidence: overallConfidence(facts),
    unknownDomains,
  };
}
