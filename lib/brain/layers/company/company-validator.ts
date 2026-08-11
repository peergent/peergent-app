import type { CompanyGraph } from "./types";

export type CompanyValidationResult = {
  valid: boolean;
  score: number;
  issues: readonly string[];
};

export function validateCompanyGraph(graph: CompanyGraph): CompanyValidationResult {
  const issues: string[] = [];

  if (!graph.organizationId) issues.push("Missing organizationId.");
  if (graph.facts.length === 0) issues.push("Company graph has no facts.");

  for (const fact of graph.facts) {
    if (!fact.value.trim()) issues.push(`Fact ${fact.id} has empty value.`);
    if (fact.sourceIds.length === 0) issues.push(`Fact ${fact.id} missing source linkage.`);
    if (fact.evidence.length === 0) issues.push(`Fact ${fact.id} missing evidence.`);
  }

  for (const node of graph.nodes) {
    for (const factId of node.factIds) {
      if (!graph.facts.some((f) => f.id === factId)) {
        issues.push(`Node ${node.id} references missing fact ${factId}.`);
      }
    }
  }

  for (const rel of graph.relations) {
    if (!graph.facts.some((f) => f.id === rel.fromFactId)) {
      issues.push(`Relation ${rel.id} missing fromFact.`);
    }
    if (!graph.facts.some((f) => f.id === rel.toFactId)) {
      issues.push(`Relation ${rel.id} missing toFact.`);
    }
  }

  const duplicateKeys = graph.facts.filter(
    (f, i, arr) => arr.findIndex((x) => x.key === f.key && x.domain === f.domain) !== i
  );
  if (duplicateKeys.length) {
    issues.push(`Duplicate fact keys detected: ${duplicateKeys.map((f) => f.key).join(", ")}`);
  }

  const score = Math.max(0, 100 - issues.length * 8);
  return { valid: issues.length === 0, score, issues };
}

export function scoreCompanyQuality(graph: CompanyGraph): number {
  return validateCompanyGraph(graph).score;
}
