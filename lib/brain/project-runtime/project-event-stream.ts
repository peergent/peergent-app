/**
 * Aggregated project event stream — engine + brain lifecycle events.
 */

import type { ProjectBrainId } from "../project-engine/types";
import type { ProjectEpisodeRecord, ProjectRuntimeEvent } from "./types";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";

const EVENT_LABELS: Record<string, string> = {
  project_started: "Project started",
  company_completed: "Company understanding complete",
  research_started: "Research started",
  research_completed: "Research complete",
  reasoning_completed: "Reasoning complete",
  marketing_intelligence_completed: "Marketing intelligence complete",
  strategy_created: "Strategy created",
  planning_completed: "Planning complete",
  creative_generated: "Creative generated",
  validation_completed: "Validation complete",
  memory_checkpoint_completed: "Memory checkpoint complete",
  waiting_for_approval: "Waiting for approval",
  approval_received: "Approval received",
  execution_started: "Execution started",
  execution_completed: "Execution complete",
  waiting_for_outcomes: "Waiting for performance outcomes",
  performance_observations_received: "Performance observations received",
  learning_completed: "Learning complete",
  memory_updated: "Memory updated",
  project_completed: "Project complete",
};

export function appendRuntimeEvent(input: {
  episode: ProjectEpisodeRecord;
  type: string;
  brainId: ProjectBrainId | null;
  outputRef?: string | null;
  customerSafeSummary?: string;
}): ProjectRuntimeEvent {
  const event: ProjectRuntimeEvent = {
    eventId: `evt-${input.type}-${Date.now()}`,
    projectId: input.episode.snapshot.projectId,
    organizationId: input.episode.snapshot.organizationId,
    brainId: input.brainId,
    timestamp: new Date().toISOString(),
    correlationId: input.episode.correlationId,
    type: input.type,
    outputRef: input.outputRef ?? null,
    customerSafeSummary: input.customerSafeSummary ?? EVENT_LABELS[input.type],
  };
  getDefaultProjectEpisodeRepository().appendEvent(input.episode.snapshot.projectId, event);
  return event;
}

export function brainCompletedEventType(brainId: ProjectBrainId): string {
  const map: Partial<Record<ProjectBrainId, string>> = {
    company: "company_completed",
    research: "research_completed",
    reasoning: "reasoning_completed",
    marketing_intelligence: "marketing_intelligence_completed",
    strategy: "strategy_created",
    planning: "planning_completed",
    creative: "creative_generated",
    validation: "validation_completed",
    memory: "memory_checkpoint_completed",
    execution: "execution_completed",
    learning: "learning_completed",
  };
  return map[brainId] ?? "brain_completed";
}

export function listProjectEvents(projectId: string): readonly ProjectRuntimeEvent[] {
  return getDefaultProjectEpisodeRepository().listEvents(projectId);
}
