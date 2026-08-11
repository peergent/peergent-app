import type { CompanyFact, CompanyRelation } from "./types";

function uid(n: number): string {
  return `crel-${n}`;
}

/** Build relations between company facts — no duplicated ownership. */
export function buildCompanyRelations(facts: readonly CompanyFact[]): CompanyRelation[] {
  const relations: CompanyRelation[] = [];
  let i = 0;

  const byDomain = new Map<string, CompanyFact[]>();
  for (const fact of facts) {
    const list = byDomain.get(fact.domain) ?? [];
    list.push(fact);
    byDomain.set(fact.domain, list);
  }

  const org = byDomain.get("organization")?.[0];
  const business = byDomain.get("business")?.[0];
  const brand = byDomain.get("brand")?.[0] ?? byDomain.get("tone_of_voice")?.[0];

  if (org && business) {
    relations.push({
      id: uid(i++),
      fromFactId: business.id,
      toFactId: org.id,
      kind: "belongs_to",
      reason: "Business model belongs to organization.",
    });
  }

  if (brand && org) {
    relations.push({
      id: uid(i++),
      fromFactId: brand.id,
      toFactId: org.id,
      kind: "belongs_to",
      reason: "Brand expression belongs to organization.",
    });
  }

  for (const product of byDomain.get("products") ?? []) {
    if (business) {
      relations.push({
        id: uid(i++),
        fromFactId: product.id,
        toFactId: business.id,
        kind: "belongs_to",
        reason: "Product belongs to business.",
      });
    }
  }

  for (const service of byDomain.get("services") ?? []) {
    if (business) {
      relations.push({
        id: uid(i++),
        fromFactId: service.id,
        toFactId: business.id,
        kind: "belongs_to",
        reason: "Service belongs to business.",
      });
    }
  }

  for (const audience of byDomain.get("audience") ?? []) {
    for (const product of (byDomain.get("products") ?? []).slice(0, 1)) {
      relations.push({
        id: uid(i++),
        fromFactId: audience.id,
        toFactId: product.id,
        kind: "related_to",
        reason: "Audience related to product catalogue.",
      });
    }
  }

  for (const usp of byDomain.get("usps") ?? []) {
    const positioning = byDomain.get("competitive_position")?.[0];
    if (positioning) {
      relations.push({
        id: uid(i++),
        fromFactId: usp.id,
        toFactId: positioning.id,
        kind: "supports",
        reason: "USP supports competitive positioning.",
      });
    }
  }

  for (const goal of byDomain.get("business_goals") ?? []) {
    if (business) {
      relations.push({
        id: uid(i++),
        fromFactId: goal.id,
        toFactId: business.id,
        kind: "depends_on",
        reason: "Goal depends on business context.",
      });
    }
  }

  for (const source of byDomain.get("knowledge_sources") ?? []) {
    const orgFact = org;
    if (orgFact) {
      relations.push({
        id: uid(i++),
        fromFactId: source.id,
        toFactId: orgFact.id,
        kind: "derived_from",
        reason: "Knowledge source registered for organization.",
      });
    }
  }

  return relations;
}
