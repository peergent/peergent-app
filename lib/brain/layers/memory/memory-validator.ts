import type { MemoryGraph } from "./types";

export type MemoryMetaIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type MemoryMetaResult = {
  valid: boolean;
  score: number;
  issues: readonly MemoryMetaIssue[];
};

/** Meta-validation — ensures MemoryGraph completeness before persistence. */
export function validateMemoryGraph(graph: MemoryGraph): MemoryMetaResult {
  const issues: MemoryMetaIssue[] = [];

  if (!graph.summary) {
    issues.push({ code: "missing_summary", message: "Memory summary is required.", severity: "error" });
  }

  if (graph.nodes.length === 0 && graph.memories.length > 0) {
    issues.push({ code: "missing_nodes", message: "Memory nodes must reference stored memories.", severity: "error" });
  }

  for (const mem of graph.memories) {
    if (!mem.title || !mem.description || !mem.category) {
      issues.push({
        code: "incomplete_memory",
        message: `Memory ${mem.id} missing required fields.`,
        severity: "error",
      });
    }
    if (mem.evidence.length === 0) {
      issues.push({
        code: "missing_evidence",
        message: `Memory ${mem.id} has no evidence.`,
        severity: "warning",
      });
    }
  }

  if (!graph.summary.reasoningSummary) {
    issues.push({ code: "missing_reasoning", message: "Reasoning summary is required.", severity: "warning" });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 10);

  return { valid: errors.length === 0, score, issues };
}

export function scoreMemoryQuality(graph: MemoryGraph): number {
  return validateMemoryGraph(graph).score;
}
