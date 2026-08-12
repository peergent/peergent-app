import type { ContextAdapterInput, ContextAdapterResult, ContextSourceAdapter } from "./types";
import { createContextItem } from "../normalize/context-item";

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
    } else {
      items.push(
        createContextItem({
          category: "project",
          key: "project.objective",
          label: "Project objective",
          summary: ctx?.description ?? "Project objective not recorded.",
          organizationId: input.organizationId,
          projectId: input.projectId,
          provenance: { kind: "campaign_context", refId: `${input.projectId}:objective`, capturedAt: at },
          sourceAdapterId: "project",
          confidence: ctx?.description ? "medium" : "unknown",
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
