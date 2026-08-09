/**
 * Universal Brain contract — every Brain exposes the same interface to the Project Engine.
 * The engine never knows implementation details (LLM, deterministic, layer graph).
 */

import type { ProjectBrainId } from "./types";

/** Immutable context package assembled by the engine before each brain run. */
export type BrainContextPackage = {
  organizationId: string;
  peerId: string;
  projectId: string;
  episodeId: string;
  locale: "nl" | "en";
  contextVersion: number;
  /** Slice keys populated by Context Engine */
  slices: BrainContextSlices;
  /** Outputs from previously completed brains in this episode */
  priorOutputs: readonly BrainPriorOutput[];
  /** Decision ids from prior brains */
  priorDecisionIds: readonly string[];
  /** Memory entity refs the brain may read */
  memoryRefs: readonly string[];
  assembledAt: string;
};

export type BrainContextSlices = {
  business: boolean;
  brand: boolean;
  website: boolean;
  products: boolean;
  competitors: boolean;
  goals: boolean;
  campaign: boolean;
};

/** Reference to a prior brain output — not the full payload (engine passes refs). */
export type BrainPriorOutput = {
  brainId: ProjectBrainId;
  capabilityId: string;
  outputRef: string;
  generatedAt: string;
};

/** Input every brain receives — engine-assembled, brain-agnostic. */
export type BrainInput<TPayload = unknown> = {
  brainId: ProjectBrainId;
  context: BrainContextPackage;
  payload: TPayload;
  idempotencyKey: string;
  retryAttempt: number;
};

/** Structured output handle — full payload lives in brain persistence. */
export type BrainOutput = {
  outputRef: string;
  capabilityIds: readonly string[];
  decisionIds: readonly string[];
  generatedAt: string;
};

/** Events a brain publishes during execution — feed activity/timeline/progress. */
export type BrainEvent = {
  id: string;
  at: string;
  type: string;
  title: string;
  subtitle: string;
  whyItMatters: string;
};

export type BrainStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "waiting_approval"
  | "skipped";

/** Result every brain returns — engine uses this to advance state. */
export type BrainResult<TOutput = BrainOutput> = {
  brainId: ProjectBrainId;
  status: BrainStatus;
  output: TOutput | null;
  events: readonly BrainEvent[];
  confidence: BrainConfidence | null;
  durationMs: number;
  errorCode: string | null;
  /** When true, engine transitions to waiting_for_approval */
  requiresApproval: boolean;
  approvalKind: string | null;
};

export type BrainConfidence = {
  value: number;
  label: "high" | "medium" | "low";
};

/**
 * Brain plugin contract — future Brains implement this; engine schedules via brainId only.
 * Creative Brain will be the first implementation wired in PX-35.
 */
export type ProjectBrainContract<TInput = unknown, TOutput = BrainOutput> = {
  readonly id: ProjectBrainId;
  readonly capabilityIds: readonly string[];
  readonly requiredContextSlices: readonly (keyof BrainContextSlices)[];
  execute(input: BrainInput<TInput>): Promise<BrainResult<TOutput>>;
};

/** Registry slot — brains register without engine knowing internals. */
export type ProjectBrainRegistry = Readonly<
  Partial<Record<ProjectBrainId, ProjectBrainContract>>
>;
