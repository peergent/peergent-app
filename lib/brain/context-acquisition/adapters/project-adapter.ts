import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import { createContextItem } from "../normalize/context-item";

/** Canonical project objective for PX-49 — distinct from categorical goal labels. */
function resolveProjectObjectiveSummary(ctx: CampaignContext | null | undefined): {
  summary: string;
  confidence: "high" | "medium";
} | null {
  const description = ctx?.description?.trim();
  if (description) {
    return { summary: description, confidence: "high" };
  }
  const goals = ctx?.goals?.filter(Boolean) ?? [];
  if (goals.length > 0) {
    return { summary: goals.join("; "), confidence: "medium" };
  }
  return null;
}

export const projectContextAdapter: ContextSourceAdapter = {
  id: "project",
  categories: ["project", "task"],
  async acquire(input: ContextAdapterInput): Promise<ContextAdapterResult> {
    const started = Date.now();
    const ctx = input.campaignContext;
    if (!input.projectId && !ctx) {
      return {
        adapterId: "project",
        status: "skipped",
        items: [],
        durationMs: Date.now() - started,
      };
    }

    const at = new Date().toISOString();
    const items = [];

    if (input.projectId) {
      items.push(
        createContextItem({
          category: "project",
          key: "project.identity",
          label: "Project",
          summary: ctx?.campaignName ?? input.projectId,
          organizationId: input.organizationId,
          projectId: input.projectId,
          provenance: { kind: "campaign_context", refId: input.projectId, capturedAt: at },
          sourceAdapterId: "project",
          confidence: "high",
        })
      );
    }

    const objective = resolveProjectObjectiveSummary(ctx);
    if (objective) {
      items.push(
        createContextItem({
          category: "project",
          key: "project.objective",
          label: "Project objective",
          summary: objective.summary,
          organizationId: input.organizationId,
          projectId: input.projectId,
          provenance: {
            kind: "campaign_context",
            refId: `${input.projectId}:objective`,
            capturedAt: at,
          },
          sourceAdapterId: "project",
          confidence: objective.confidence,
        })
      );
    }

    if (ctx?.goals?.length) {
      items.push(
        createContextItem({
          category: "project",
          key: "project.goals",
          label: "Project goals",
          summary: ctx.goals.slice(0, 5).join("; "),
          organizationId: input.organizationId,
          projectId: input.projectId,
          provenance: { kind: "campaign_context", refId: `${input.projectId}:goals`, capturedAt: at },
          sourceAdapterId: "project",
          confidence: "high",
        })
      );
    }

    if (ctx?.selectedChannels?.length) {
      items.push(
        createContextItem({
          category: "task",
          key: "task.channels",
          label: "Channels",
          summary: ctx.selectedChannels.join(", "),
          organizationId: input.organizationId,
          projectId: input.projectId,
          provenance: { kind: "campaign_context", refId: `${input.projectId}:channels`, capturedAt: at },
          sourceAdapterId: "project",
          confidence: "high",
        })
      );
    }

    return {
      adapterId: "project",
      status: items.length > 0 ? "completed" : "partial",
      items: items.slice(0, input.budget.maxItemsPerAdapter),
      durationMs: Date.now() - started,
    };
  },
};
