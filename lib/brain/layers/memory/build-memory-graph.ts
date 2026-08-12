import type {
  MemoryConfidence,
  MemoryDomainId,
  MemoryEvidence,
  MemoryGraph,
  MemoryImportance,
  MemoryNode,
  MemoryRecord,
  MemoryRelation,
  MemorySourceKind,
  MemorySummary,
} from "./types";
import { MEMORY_LAYER_VERSION } from "./types";
import type { MemoryBrainInput } from "./types";
import { MEMORY_MODULE_SPECS } from "./modules/specs";
import {
  applyMemoryDecision,
  decideMemoryAction,
  memoryMergeKey,
} from "./merge-strategy";

function uid(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function evidence(
  source: MemorySourceKind,
  refId: string,
  summary: string,
  at: string,
  index: number
): MemoryEvidence {
  return { id: `ev-${source}-${index}`, source, refId, summary, capturedAt: at };
}

function candidate(
  input: MemoryBrainInput,
  at: string,
  index: number,
  partial: Omit<MemoryRecord, "id" | "createdAt" | "updatedAt" | "lifecycle" | "mergeKey" | "expiresAt">
): MemoryRecord {
  const id = uid("mem", index);
  return {
    id,
    ...partial,
    createdAt: at,
    updatedAt: at,
    expiresAt: null,
    lifecycle: "active",
    mergeKey: memoryMergeKey(partial.category, partial.title),
  };
}

function extractBusinessMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const records: MemoryRecord[] = [];
  let i = startIndex;
  const campaignId = input.projectId;

  const goal =
    input.campaignContext?.goals[0] ??
    input.strategyGraph?.businessSummary?.description?.slice(0, 120) ??
    "";
  if (goal) {
    records.push(
      candidate(input, at, i++, {
        category: "business_memory",
        title: "Primary business goal",
        description: goal,
        source: "strategy",
        confidence: "high",
        importance: "critical",
        evidence: [evidence("strategy", "business-goal", goal, at, i)],
        relatedCampaigns: [campaignId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["goal", "business"],
      })
    );
  }

  const valueProp = input.strategyGraph?.valueProposition?.description ?? "";
  if (valueProp) {
    records.push(
      candidate(input, at, i++, {
        category: "business_memory",
        title: "Value proposition",
        description: valueProp,
        source: "strategy",
        confidence: "medium",
        importance: "high",
        evidence: [evidence("strategy", "value-prop", valueProp, at, i)],
        relatedCampaigns: [campaignId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["usp", "business"],
      })
    );
  }

  return records;
}

function extractBrandMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const records: MemoryRecord[] = [];
  let i = startIndex;
  const brand = input.brandGraph;
  if (!brand) return records;

  for (const fact of brand.model.facts.slice(0, 6)) {
    if (fact.concept !== "tone_of_voice" && fact.concept !== "writing_style" && fact.concept !== "messaging") {
      continue;
    }
    records.push(
      candidate(input, at, i++, {
        category: "brand_memory",
        title: fact.label,
        description: fact.value,
        source: "strategy",
        confidence: fact.confidence >= 0.8 ? "high" : fact.confidence >= 0.5 ? "medium" : "low",
        importance: "high",
        evidence: [evidence("strategy", fact.id, fact.value, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["brand", fact.concept],
      })
    );
  }

  return records;
}

function extractAudienceMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const records: MemoryRecord[] = [];
  let i = startIndex;

  const audience =
    input.campaignContext?.audience ??
    input.strategyGraph?.primaryAudience?.description ??
    "";
  if (audience) {
    records.push(
      candidate(input, at, i++, {
        category: "audience_memory",
        title: "Primary audience",
        description: audience,
        source: "strategy",
        confidence: "high",
        importance: "critical",
        evidence: [evidence("strategy", "audience", audience, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["icp", "audience"],
      })
    );
  }

  const creative = input.creativeGraph;
  if (creative) {
    for (const msg of creative.messaging) {
      for (const obj of msg.objections.slice(0, 3)) {
        records.push(
          candidate(input, at, i++, {
            category: "audience_memory",
            title: `Objection: ${obj.objection.slice(0, 60)}`,
            description: obj.response,
            source: "creative",
            confidence: "medium",
            importance: "medium",
            evidence: [evidence("creative", msg.id, obj.response, at, i)],
            relatedCampaigns: [input.projectId],
            relatedDecisions: [],
            relatedAssets: [],
            tags: ["objection", "audience"],
          })
        );
      }
    }
  }

  return records;
}

function extractCompetitiveMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const records: MemoryRecord[] = [];
  let i = startIndex;

  const diff = input.strategyGraph?.differentiators?.description ?? "";
  if (diff) {
    records.push(
      candidate(input, at, i++, {
        category: "competitive_memory",
        title: "Key differentiator",
        description: diff,
        source: "strategy",
        confidence: "medium",
        importance: "high",
        evidence: [evidence("strategy", "differentiators", diff, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["differentiation", "competitive"],
      })
    );
  }

  const positioning = input.strategyGraph?.strategicPositioning?.description ?? "";
  if (positioning) {
    records.push(
      candidate(input, at, i++, {
        category: "competitive_memory",
        title: "Strategic positioning",
        description: positioning,
        source: "strategy",
        confidence: "medium",
        importance: "high",
        evidence: [evidence("strategy", "positioning", positioning, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["positioning", "competitive"],
      })
    );
  }

  return records;
}

function extractCreativeMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const creative = input.creativeGraph;
  if (!creative) return [];
  const records: MemoryRecord[] = [];
  let i = startIndex;

  const selected = creative.campaigns.find((c) => c.selected) ?? creative.campaigns[0];
  if (selected) {
    records.push(
      candidate(input, at, i++, {
        category: "creative_memory",
        title: `Winning concept: ${selected.name}`,
        description: `${selected.keyMessage} — ${selected.emotionalTrigger}`,
        source: "creative",
        confidence: selected.confidence,
        importance: "high",
        evidence: [evidence("creative", selected.id, selected.keyMessage, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: creative.decisions.map((d) => d.id),
        relatedAssets: [],
        tags: ["concept", "winning"],
      })
    );
  }

  for (const del of creative.deliverables.slice(0, 5)) {
    records.push(
      candidate(input, at, i++, {
        category: "creative_memory",
        title: `Headline: ${del.headline.slice(0, 60)}`,
        description: del.hook,
        source: "creative",
        confidence: "medium",
        importance: "medium",
        evidence: [evidence("creative", del.id, del.headline, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: [del.id],
        tags: ["headline", del.channel],
      })
    );
  }

  for (const discarded of creative.discardedIdeas.slice(0, 3)) {
    records.push(
      candidate(input, at, i++, {
        category: "creative_memory",
        title: `Rejected: ${discarded.idea.slice(0, 50)}`,
        description: discarded.reason,
        source: "creative",
        confidence: "medium",
        importance: "low",
        evidence: [evidence("creative", discarded.phase, discarded.reason, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["rejected", "concept"],
      })
    );
  }

  return records;
}

function extractValidationMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const validation = input.validationGraph;
  if (!validation) return [];
  const records: MemoryRecord[] = [];
  let i = startIndex;

  for (const approved of validation.report.approvedDeliverables) {
    records.push(
      candidate(input, at, i++, {
        category: "validation_memory",
        title: `Approved: ${approved.deliverableType}`,
        description: approved.reason,
        source: "validation",
        confidence: "high",
        importance: "high",
        evidence: [evidence("validation", approved.deliverableId, approved.reason, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [approved.id],
        relatedAssets: [approved.deliverableId],
        tags: ["approved", approved.channel],
      })
    );
  }

  for (const rejected of validation.report.rejectedDeliverables) {
    records.push(
      candidate(input, at, i++, {
        category: "validation_memory",
        title: `Rejected: ${rejected.deliverableType}`,
        description: rejected.reason,
        source: "validation",
        confidence: "high",
        importance: "high",
        evidence: [evidence("validation", rejected.deliverableId, rejected.reason, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [rejected.id],
        relatedAssets: [rejected.deliverableId],
        tags: ["rejected", rejected.channel],
      })
    );
  }

  for (const issue of validation.report.issues.slice(0, 5)) {
    records.push(
      candidate(input, at, i++, {
        category: "validation_memory",
        title: issue.reason.slice(0, 80),
        description: issue.suggestedResolution,
        source: "validation",
        confidence: issue.blocking ? "high" : "medium",
        importance: issue.blocking ? "critical" : "medium",
        evidence: [evidence("validation", issue.id, issue.businessImpact, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: issue.deliverableId ? [issue.deliverableId] : [],
        tags: issue.blocking ? ["blocking", "issue"] : ["issue", issue.category],
      })
    );
  }

  for (const warning of validation.report.warnings.slice(0, 3)) {
    records.push(
      candidate(input, at, i++, {
        category: "validation_memory",
        title: warning.reason.slice(0, 80),
        description: warning.suggestedResolution,
        source: "validation",
        confidence: "medium",
        importance: "medium",
        evidence: [evidence("validation", warning.id, warning.businessImpact, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: warning.deliverableId ? [warning.deliverableId] : [],
        tags: ["warning", warning.category],
      })
    );
  }

  return records;
}

function extractLearningMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const records: MemoryRecord[] = [];
  let i = startIndex;
  const validation = input.validationGraph;

  if (validation && validation.report.publicationReadiness !== "BLOCKED") {
    records.push(
      candidate(input, at, i++, {
        category: "learning_memory",
        title: "Quality review outcome",
        description: validation.report.reasoningSummary,
        source: "validation",
        confidence: validation.confidence,
        importance: "medium",
        evidence: [evidence("validation", validation.campaignId, validation.report.reasoningSummary, at, i)],
        relatedCampaigns: [input.projectId],
        relatedDecisions: [],
        relatedAssets: [],
        tags: ["quality", "lesson"],
      })
    );
  }

  if (input.decisionCollection?.decisions.length) {
    for (const d of input.decisionCollection.decisions.slice(0, 2)) {
      records.push(
        candidate(input, at, i++, {
          category: "learning_memory",
          title: d.title,
          description: d.summary,
          source: "strategy",
          confidence:
            d.confidence === "very_high" || d.confidence === "high"
              ? "high"
              : d.confidence === "medium"
                ? "medium"
                : "low",
          importance: "medium",
          evidence: [evidence("strategy", d.id, d.reasoning, at, i)],
          relatedCampaigns: [input.projectId],
          relatedDecisions: [d.id],
          relatedAssets: [],
          tags: ["decision", "lesson"],
        })
      );
    }
  }

  return records;
}

function extractProposalMemories(input: MemoryBrainInput, at: string, startIndex: number): MemoryRecord[] {
  const proposals = input.learningProposals ?? [];
  const records: MemoryRecord[] = [];
  let i = startIndex;

  for (const proposal of proposals) {
    const importance: MemoryImportance =
      proposal.importance === "high" ? "high" : proposal.importance === "medium" ? "medium" : "low";
    const actionConfidence: MemoryConfidence = proposal.confidence;

    if (proposal.durability === "temporary" && proposal.confidence === "low") {
      continue;
    }

    records.push(
      candidate(input, at, i++, {
        category: "learning_memory",
        title: proposal.title,
        description: proposal.learning,
        source: "performance",
        confidence: actionConfidence,
        importance,
        evidence: proposal.evidenceRefs.map((ref: string, idx: number) =>
          evidence("performance", ref, proposal.reasonToStore, at, idx + i)
        ),
        relatedCampaigns: proposal.relatedCampaigns,
        relatedDecisions: [],
        relatedAssets: proposal.relatedDeliverables,
        tags: [proposal.category, proposal.durability, proposal.recommendedMemoryDomain],
      })
    );
  }

  return records;
}

function buildNodes(memories: readonly MemoryRecord[], at: string): MemoryNode[] {
  return MEMORY_MODULE_SPECS.map((spec) => ({
    id: `node-${spec.id}`,
    domain: spec.id,
    label: spec.title,
    memoryIds: memories.filter((m) => m.category === spec.id).map((m) => m.id),
    layerOrder: spec.layerOrder,
  })).filter((n) => n.memoryIds.length > 0);
}

function buildRelations(memories: readonly MemoryRecord[]): MemoryRelation[] {
  const relations: MemoryRelation[] = [];
  let i = 0;

  const byCampaign = new Map<string, MemoryRecord[]>();
  for (const m of memories) {
    for (const c of m.relatedCampaigns) {
      const list = byCampaign.get(c) ?? [];
      list.push(m);
      byCampaign.set(c, list);
    }
  }

  for (const mem of memories) {
    if (mem.category === "creative_memory" && mem.tags.includes("concept")) {
      const validation = memories.find(
        (v) => v.category === "validation_memory" && v.tags.includes("approved")
      );
      if (validation) {
        relations.push({
          id: uid("rel", i++),
          fromMemoryId: mem.id,
          toMemoryId: validation.id,
          kind: "derived_from",
          reason: "Creative concept validated before memory commit.",
        });
      }
    }

    if (mem.category === "audience_memory" && mem.tags.includes("objection")) {
      const creative = memories.find((c) => c.category === "creative_memory" && c.tags.includes("headline"));
      if (creative) {
        relations.push({
          id: uid("rel", i++),
          fromMemoryId: mem.id,
          toMemoryId: creative.id,
          kind: "related_to",
          reason: "Objection addressed in creative output.",
        });
      }
    }
  }

  return relations;
}

function overallConfidence(memories: readonly MemoryRecord[]): MemoryConfidence {
  if (memories.length === 0) return "low";
  const high = memories.filter((m) => m.confidence === "high").length;
  const ratio = high / memories.length;
  if (ratio >= 0.6) return "high";
  if (ratio >= 0.3) return "medium";
  return "low";
}

/** Build MemoryGraph from upstream brains and apply merge decisions. */
export function buildMemoryGraph(input: MemoryBrainInput): MemoryGraph {
  const at = new Date().toISOString();
  const nl = input.locale === "nl";
  const prior = input.priorMemories ?? [];

  let index = 0;
  const candidates: MemoryRecord[] = [
    ...extractBusinessMemories(input, at, index),
  ];
  index = candidates.length;
  candidates.push(...extractBrandMemories(input, at, index));
  index = candidates.length;
  candidates.push(...extractAudienceMemories(input, at, index));
  index = candidates.length;
  candidates.push(...extractCompetitiveMemories(input, at, index));
  index = candidates.length;
  candidates.push(...extractCreativeMemories(input, at, index));
  index = candidates.length;
  candidates.push(...extractValidationMemories(input, at, index));
  index = candidates.length;
  candidates.push(...extractLearningMemories(input, at, index));
  index = candidates.length;
  candidates.push(...extractProposalMemories(input, at, index));

  const stored: MemoryRecord[] = [...prior.filter((m) => m.lifecycle === "active")];
  const decisions: import("./types").MemoryDecision[] = [];
  const evolution: import("./types").MemoryEvolutionEntry[] = [];
  let mergedCount = 0;
  let skippedCount = 0;

  for (const cand of candidates) {
    const { action, target } = decideMemoryAction({
      candidate: cand,
      existing: stored,
      approvalGranted: input.approvalGranted ?? false,
    });
    const result = applyMemoryDecision({ candidate: cand, action, target });
    decisions.push(result.decision);

    if (result.evolution) evolution.push(result.evolution);

    if (!result.record) {
      skippedCount++;
      continue;
    }

    if (action === "merge" && target) {
      const idx = stored.findIndex((m) => m.id === target.id);
      if (idx >= 0) stored[idx] = result.record;
      mergedCount++;
    } else {
      stored.push(result.record);
    }
  }

  const newMemories = stored.filter(
    (m) => !prior.some((p) => p.id === m.id) || prior.find((p) => p.id === m.id)?.updatedAt !== m.updatedAt
  );

  const summary: MemorySummary = {
    storedCount: newMemories.length,
    mergedCount,
    skippedCount,
    archivedCount: 0,
    forgottenCount: decisions.filter((d) => d.action === "forget").length,
    totalActiveMemories: stored.filter((m) => m.lifecycle === "active").length,
    confidence: overallConfidence(stored),
    reasoningSummary: nl
      ? `${newMemories.length} herinneringen opgeslagen, ${mergedCount} samengevoegd, ${skippedCount} overgeslagen.`
      : `${newMemories.length} memories stored, ${mergedCount} merged, ${skippedCount} skipped.`,
  };

  const creativeRef = input.creativeGraph
    ? `creative:${input.organizationId}:${input.projectId}:${input.creativeGraph.createdAt}`
    : null;
  const validationRef = input.validationGraph
    ? `validation:${input.organizationId}:${input.projectId}:${input.validationGraph.createdAt}`
    : null;

  return {
    version: MEMORY_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.projectId,
    episodeId: input.episodeId,
    createdAt: at,
    creativeGraphRef: creativeRef,
    validationGraphRef: validationRef,
    nodes: buildNodes(stored, at),
    relations: buildRelations(stored),
    memories: stored,
    decisions,
    evolution,
    summary,
    confidence: summary.confidence,
  };
}

export function buildMemorySummary(graph: MemoryGraph): MemorySummary {
  return graph.summary;
}
