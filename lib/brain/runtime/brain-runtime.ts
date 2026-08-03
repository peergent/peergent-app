import type { BrainRunContext } from "../context/run-context";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainCacheStore } from "../cache/store";
import { buildCacheKey } from "../cache/store";
import { hashContextSlices } from "../providers/token-strategy";
import { resolveBrainEnvironment } from "../context/resolve-environment";
import { getBrainCapability } from "../capabilities/registry";
import type { BrainCapabilityId } from "../capabilities/registry";
import { evaluateBrainPolicy } from "../policy/approval-policy";
import type { BrainRunRequestWithBudget } from "./run-request";
import type { BrainRunRecord } from "./repositories/contracts";
import type { BrainRunRepository } from "./repositories/contracts";
import type { BrainOutputRepository } from "./repositories/contracts";
import type { BrainAuditRepository } from "./repositories/contracts";
import type { BrainIdempotencyRepository } from "./repositories/contracts";
import type { AsyncBrainRepositories, RepositoryStorageMode } from "../persistence/contracts";
import { hashIdempotencyRequest, hashOutputContent } from "../persistence/sync-async-adapters";
import { logBrainOperation } from "../persistence/brain-logger";
import type { BrainRunResult, BrainRunSubmitResult } from "./run-result";
import { transitionStatus } from "./state-machine";
import { isTerminalBrainRunStatus } from "./run-lifecycle";
import { BrainRunNotFoundError, BrainRuntimeError } from "./errors";
import {
  assertBudgetAllowed,
  createRunBudget,
  recordProviderUsage,
  recordZeroProviderUsage,
  validateRuntimeBudget,
} from "./budget-validator";
import { isBrainProviderWithUsage } from "../providers/llm-brain-provider";
import {
  capabilityContextSlices,
  evaluateReadinessGate,
  missingCriticalFieldsFromAssembly,
} from "./readiness-gate";
import { projectBrainContext, buildCacheKeyParts } from "./context-projection";
import { selectBrainProvider } from "./provider-selector";
import {
  assertValidBrainOutput,
  outputHasCustomerExplanation,
  validateBrainStructuredOutput,
} from "./output-validator";
import { buildRunAuditMetadata, buildRunAuditRecord } from "./audit-builder";
import { assertRunOrganizationMatch } from "./repositories/in-memory-run-repository";
import type { ReadinessDimension } from "../context/readiness";
import { buildCapabilityExecutionContext, hashUpstreamOutputVersions } from "../integration/build-capability-execution-context";
import {
  validateCapabilityOutputQuality,
  collapseDuplicateFindings,
} from "../capabilities/shared/output-quality";

export type BrainRuntimeDeps = {
  runRepository: BrainRunRepository;
  outputRepository: BrainOutputRepository;
  auditRepository: BrainAuditRepository;
  idempotencyRepository: BrainIdempotencyRepository;
  asyncRepositories?: AsyncBrainRepositories;
  storageMode?: RepositoryStorageMode;
  cache: BrainCacheStore;
  providers: readonly BrainCapabilityProvider[];
  assembleContext: (request: BrainRunRequestWithBudget) => Promise<ContextAssemblyResult> | ContextAssemblyResult;
};

function dimensionScoreMap(
  assembly: ContextAssemblyResult
): Readonly<Record<ReadinessDimension, number>> {
  const map = {} as Record<ReadinessDimension, number>;
  for (const score of assembly.readiness.scores) {
    map[score.dimension] = score.score;
  }
  return map;
}

function createRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toRunContext(request: BrainRunRequestWithBudget, environment: ReturnType<typeof resolveBrainEnvironment>): BrainRunContext {
  return {
    organizationId: request.organizationId,
    peerId: request.peerId,
    campaignId: request.campaignId,
    environment,
    actorId: request.actorId,
    permissions: request.permissions ?? [],
    requestId: request.requestId ?? `req-${Date.now()}`,
    correlationId: request.correlationId ?? `corr-${Date.now()}`,
    locale: request.locale,
  };
}

function initialRun(request: BrainRunRequestWithBudget): BrainRunRecord {
  const now = new Date().toISOString();
  const environment = resolveBrainEnvironment({
    environment: request.environment,
    peerId: request.peerId,
  });
  const runId = createRunId();
  return {
    id: runId,
    traceId: request.correlationId ?? runId,
    parentRunId: request.parentRunId,
    childRunIds: [],
    organizationId: request.organizationId,
    peerId: request.peerId,
    campaignId: request.campaignId,
    environment,
    capabilityId: request.capabilityId,
    status: "queued",
    usage: {},
    budget: createRunBudget(request.budget),
    startedAt: now,
    updatedAt: now,
  };
}

/** Provider-neutral Brain Runtime — framework independent. */
export class BrainRuntime {
  constructor(private readonly deps: BrainRuntimeDeps) {}

  submitRun(request: BrainRunRequestWithBudget): BrainRunSubmitResult {
    if (request.idempotencyKey) {
      const existing = this.deps.idempotencyRepository.get(
        request.organizationId,
        request.idempotencyKey
      );
      if (existing) {
        const run = this.deps.runRepository.getById(request.organizationId, existing);
        if (run) {
          return { runId: run.id, status: run.status, idempotentReplay: true };
        }
      }
    }

    const run = this.deps.runRepository.create(initialRun(request));
    if (request.idempotencyKey) {
      this.deps.idempotencyRepository.set(
        request.organizationId,
        request.idempotencyKey,
        run.id
      );
    }
    return { runId: run.id, status: run.status, idempotentReplay: false };
  }

  lookupRun(organizationId: string, runId: string): BrainRunRecord {
    const run = this.deps.runRepository.getById(organizationId, runId);
    if (!run) throw new BrainRunNotFoundError(runId);
    assertRunOrganizationMatch(run, organizationId);
    return run;
  }

  cancelRun(organizationId: string, runId: string): BrainRunRecord {
    const run = this.lookupRun(organizationId, runId);
    if (run.status === "completed" || run.status === "partial" || run.status === "failed") {
      throw new BrainRuntimeError("run_terminal", `Cannot cancel terminal run ${runId}`);
    }
    const updated: BrainRunRecord = {
      ...run,
      status: transitionStatus(run.status, "cancelled"),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    return this.deps.runRepository.update(updated);
  }

  resumeRun(organizationId: string, runId: string): Promise<BrainRunResult> {
    const run = this.lookupRun(organizationId, runId);
    if (run.status !== "waiting_for_input" && run.status !== "waiting_for_approval") {
      throw new BrainRuntimeError(
        "run_not_resumable",
        `Run ${runId} is not in a resumable state (${run.status})`
      );
    }
    const request = this.reconstructRequest(run);
    return this.executeRun(request, run.id);
  }

  executeRunSync(
    request: BrainRunRequestWithBudget,
    existingRunId?: string
  ): BrainRunResult {
    const startedMs = Date.now();
    const environment = resolveBrainEnvironment({
      environment: request.environment,
      peerId: request.peerId,
    });
    const runContext = toRunContext(request, environment);
    const capabilityDef = getBrainCapability(request.capabilityId);

    let run: BrainRunRecord;
    if (existingRunId) {
      run = this.lookupRun(request.organizationId, existingRunId);
    } else {
      const submitted = this.submitRun(request);
      run = this.lookupRun(request.organizationId, submitted.runId);
    }

    run = this.transitionRun(run, "gathering_context");
    const assembly = this.resolveAssembly(request);
    const dimensionScores = dimensionScoreMap(assembly);
    const missingCritical = missingCriticalFieldsFromAssembly(
      request.capabilityId,
      assembly.missingInformation
    );
    const readinessGate = evaluateReadinessGate({
      capabilityId: request.capabilityId,
      overallScore: assembly.readiness.overallScore,
      dimensionScores,
      missingCriticalFields: missingCritical,
      assemblyState: assembly.state,
    });

    const policy = evaluateBrainPolicy({
      executionMode: request.executionMode ?? "semi_automatic",
      approvalPolicy: request.approvalPolicy ?? "approval_required",
      capabilityApprovalRequirement: capabilityDef.approvalRequirement,
    });

    if (!readinessGate.ok) {
      run = this.transitionRun(run, readinessGate.status, {
        readinessState: assembly.state,
        contextHash: assembly.version.contextHash,
        snapshotVersion: String(assembly.version.version),
        errorCode: "readiness_insufficient",
        errorMessage: readinessGate.reasons.join("; "),
      });
      this.writeAudit(
        run,
        assembly,
        {
          contextHash: assembly.version.contextHash,
          includedSlices: [],
          excludedSlices: [],
          estimatedTokens: 0,
        },
        policy,
        false,
        Date.now() - startedMs
      );
      return { run, assembly, output: null, policy, presentation: null, cacheHit: false };
    }

    const projected = projectBrainContext({
      fullSnapshot: assembly.brainSnapshot,
      companySnapshot: assembly.companySnapshot,
      requiredSlices: capabilityDef.requiredContext,
      optionalSlices: capabilityDef.optionalContext,
      includeKnownFacts: request.capabilityId === "company_understanding",
      includeUnknowns: true,
    });

    const { provider } = selectBrainProvider({
      environment,
      capabilityId: request.capabilityId,
      providers: this.deps.providers,
    });

    assertBudgetAllowed(
      validateRuntimeBudget({
        limits: request.budget,
        budget: run.budget,
        projection: projected.projection,
        orgRunCount: this.deps.runRepository.countByOrganization(request.organizationId),
        childRunCount: request.parentRunId
          ? this.deps.runRepository.countChildRuns(request.organizationId, request.parentRunId)
          : 0,
        providerId: provider.id,
      })
    );

    run = this.transitionRun(run, "ready", {
      readinessState: assembly.state,
      contextHash: projected.projection.contextHash,
      snapshotVersion: String(assembly.version.version),
      policyDecision: policy.decision,
    });

    if (request.dryRun) {
      return { run, assembly, output: null, policy, presentation: null, cacheHit: false };
    }

    run = this.transitionRun(run, "running");

    if (!provider.executeSync) {
      throw new BrainRuntimeError("sync_not_supported", "Provider does not support synchronous execution.");
    }

    const output = this.executeProviderSync({
      provider,
      runContext,
      projected,
      request,
      assembly,
      capabilityId: request.capabilityId,
    });

    const usage = recordZeroProviderUsage(provider.id);
    const finalStatus = readinessGate.partial ? "partial" : "completed";
    const outputId = this.deps.outputRepository.store({
      organizationId: request.organizationId,
      runId: run.id,
      output,
      storedAt: new Date().toISOString(),
    });

    run = this.transitionRun(run, finalStatus, {
      outputId,
      usage: {
        providerId: usage.providerId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostCents: usage.estimatedCostCents,
        cacheHit: false,
      },
      completedAt: new Date().toISOString(),
    });

    this.writeAudit(run, assembly, projected.projection, policy, false, Date.now() - startedMs, output);

    return { run, assembly, output, policy, presentation: null, cacheHit: false };
  }

  private resolveAssembly(request: BrainRunRequestWithBudget): ContextAssemblyResult {
    const result = this.deps.assembleContext(request);
    if (result instanceof Promise) {
      throw new BrainRuntimeError(
        "sync_assembly_required",
        "Synchronous execution requires a synchronous assembleContext function."
      );
    }
    return result;
  }

  async executeRun(
    request: BrainRunRequestWithBudget,
    existingRunId?: string
  ): Promise<BrainRunResult> {
    const startedMs = Date.now();
    const environment = resolveBrainEnvironment({
      environment: request.environment,
      peerId: request.peerId,
    });
    const runContext = toRunContext(request, environment);
    const capabilityDef = getBrainCapability(request.capabilityId);
    const persistent = Boolean(this.deps.asyncRepositories);
    const requestHash = request.idempotencyKey
      ? hashIdempotencyRequest({
          organizationId: request.organizationId,
          capabilityId: request.capabilityId,
          payloadRefId: request.payloadRefId,
          campaignId: request.campaignId,
        })
      : undefined;

    let run: BrainRunRecord;
    if (existingRunId) {
      run = await this.lookupRunAsync(request.organizationId, existingRunId);
    } else {
      const submitted = await this.submitRunAsync(request, requestHash);
      run = await this.lookupRunAsync(request.organizationId, submitted.runId);
      if (submitted.idempotentReplay && isTerminalBrainRunStatus(run.status)) {
        const output = await this.getOutputAsync(request.organizationId, run.id);
        return {
          run,
          assembly: await Promise.resolve(this.deps.assembleContext(request)),
          output,
          policy: { decision: "allow", reason: "Idempotent replay." },
          presentation: null,
          cacheHit: Boolean(run.usage.cacheHit),
        };
      }
    }

    run = await this.transitionRunAsync(run, "gathering_context");
    logBrainOperation({
      level: "info",
      event: "run_transition",
      runId: run.id,
      correlationId: run.traceId,
      organizationRef: run.organizationId,
      capability: run.capabilityId,
      transition: "gathering_context",
    });

    const assembly = await Promise.resolve(this.deps.assembleContext(request));
    const dimensionScores = dimensionScoreMap(assembly);
    const missingCritical = missingCriticalFieldsFromAssembly(
      request.capabilityId,
      assembly.missingInformation
    );
    const readinessGate = evaluateReadinessGate({
      capabilityId: request.capabilityId,
      overallScore: assembly.readiness.overallScore,
      dimensionScores,
      missingCriticalFields: missingCritical,
      assemblyState: assembly.state,
    });

    if (!readinessGate.ok) {
      const status = readinessGate.status;
      run = await this.transitionRunAsync(run, status, {
        readinessState: assembly.state,
        contextHash: assembly.version.contextHash,
        snapshotVersion: String(assembly.version.version),
        errorCode: "readiness_insufficient",
        errorMessage: readinessGate.reasons.join("; "),
      });
      const policy = evaluateBrainPolicy({
        executionMode: request.executionMode ?? "semi_automatic",
        approvalPolicy: request.approvalPolicy ?? "approval_required",
        capabilityApprovalRequirement: capabilityDef.approvalRequirement,
      });
      await this.writeAuditAsync(run, assembly, {
        contextHash: assembly.version.contextHash,
        includedSlices: [],
        excludedSlices: [],
        estimatedTokens: 0,
      }, policy, false, Date.now() - startedMs);
      return { run, assembly, output: null, policy, presentation: null, cacheHit: false };
    }

    const slices = capabilityContextSlices(request.capabilityId);
    const projected = projectBrainContext({
      fullSnapshot: assembly.brainSnapshot,
      companySnapshot: assembly.companySnapshot,
      requiredSlices: capabilityDef.requiredContext,
      optionalSlices: capabilityDef.optionalContext.filter((s) => slices.includes(s)),
      includeKnownFacts: request.capabilityId === "company_understanding",
      includeUnknowns: true,
    });

    const { provider } = selectBrainProvider({
      environment,
      capabilityId: request.capabilityId,
      providers: this.deps.providers,
      costClass: capabilityDef.costClass,
    });

    const budgetCheck = validateRuntimeBudget({
      limits: request.budget,
      budget: run.budget,
      projection: projected.projection,
      orgRunCount: persistent
        ? await this.deps.asyncRepositories!.runs.countByOrganization(request.organizationId)
        : this.deps.runRepository.countByOrganization(request.organizationId),
      childRunCount: request.parentRunId
        ? persistent
          ? await this.deps.asyncRepositories!.runs.countChildRuns(request.organizationId, request.parentRunId)
          : this.deps.runRepository.countChildRuns(request.organizationId, request.parentRunId)
        : 0,
      providerId: provider.id,
    });
    assertBudgetAllowed(budgetCheck);

    const policy = evaluateBrainPolicy({
      executionMode: request.executionMode ?? "semi_automatic",
      approvalPolicy: request.approvalPolicy ?? "approval_required",
      capabilityApprovalRequirement: capabilityDef.approvalRequirement,
    });

    if (policy.decision === "block") {
      run = await this.transitionRunAsync(run, "blocked", {
        policyDecision: policy.decision,
        readinessState: assembly.state,
        contextHash: projected.projection.contextHash,
        snapshotVersion: String(assembly.version.version),
        errorMessage: policy.reason,
      });
      return { run, assembly, output: null, policy, presentation: null, cacheHit: false };
    }

    run = await this.transitionRunAsync(run, "ready", {
      readinessState: assembly.state,
      contextHash: projected.projection.contextHash,
      snapshotVersion: String(assembly.version.version),
      policyDecision: policy.decision,
    });

    const payloadHash = hashContextSlices([
      request.payloadRefId ?? "none",
      hashUpstreamOutputVersions(request.upstreamOutputs),
    ]);
    const cacheKey = buildCacheKeyParts({
      organizationId: request.organizationId,
      capabilityId: request.capabilityId,
      contextHash: projected.projection.contextHash,
      payloadHash,
      providerId: provider.id,
      capabilityVersion: capabilityDef.version,
      freshness: assembly.companySnapshot.profile.metadata.freshness ?? "unknown",
    });

    let output = null as import("../evidence/structured-output").BrainStructuredOutput | null;
    let cacheHit = false;

    if (capabilityDef.cacheable) {
      const cached = this.deps.cache.get<import("../evidence/structured-output").BrainStructuredOutput>(
        buildCacheKey(request.organizationId, request.capabilityId, cacheKey)
      );
      if (cached) {
        output = cached.value;
        cacheHit = true;
      }
    }

    if (request.dryRun) {
      return {
        run: { ...run, status: "completed", completedAt: new Date().toISOString() },
        assembly,
        output: null,
        policy,
        presentation: null,
        cacheHit,
      };
    }

    run = await this.transitionRunAsync(run, "running");

    if (!output) {
      output = await this.executeProviderAsync({
        provider,
        runContext,
        projected,
        request,
        assembly,
        capabilityId: request.capabilityId,
      });

      if (capabilityDef.cacheable && !cacheHit) {
        this.deps.cache.set(
          buildCacheKey(request.organizationId, request.capabilityId, cacheKey),
          output,
          projected.projection.contextHash,
          86_400_000
        );
        if (this.deps.asyncRepositories) {
          await this.deps.asyncRepositories.cacheMetadata.upsert({
            organizationId: request.organizationId,
            cacheKey,
            capabilityId: request.capabilityId,
            capabilityVersion: capabilityDef.version,
            contextHash: projected.projection.contextHash,
            payloadHash,
            providerClass: provider.id,
            freshness: "fresh",
            hitCount: 0,
          });
        }
      }
    }

    let usage = recordZeroProviderUsage(provider.id);
    if (isBrainProviderWithUsage(provider)) {
      const llmUsage = provider.consumeLastUsage();
      if (llmUsage) {
        usage = recordProviderUsage(provider.id, llmUsage);
      }
    }
    usage.cacheHit = cacheHit;

    let finalStatus = readinessGate.partial ? "partial" : "completed";
    if (policy.decision === "require_approval" && output.actionProposals.some((a) => a.requiresApproval)) {
      finalStatus = "waiting_for_approval";
    }

    const outputId = await this.storeOutputAsync({
      organizationId: request.organizationId,
      runId: run.id,
      output,
      storedAt: new Date().toISOString(),
      capabilityId: request.capabilityId,
      capabilityVersion: capabilityDef.version,
      providerClass: provider.id,
      contentHash: hashOutputContent(output),
      contextHash: projected.projection.contextHash,
      snapshotVersion: String(assembly.version.version),
      campaignId: request.campaignId,
    });

    run = await this.transitionRunAsync(run, finalStatus as typeof run.status, {
      outputId,
      usage: {
        providerId: usage.providerId,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCostCents: usage.estimatedCostCents,
        cacheHit: usage.cacheHit,
      },
      completedAt: new Date().toISOString(),
    });

    await this.writeAuditAsync(run, assembly, projected.projection, policy, cacheHit, Date.now() - startedMs, output);
    logBrainOperation({
      level: "info",
      event: "run_completed",
      runId: run.id,
      correlationId: run.traceId,
      organizationRef: run.organizationId,
      capability: run.capabilityId,
      transition: finalStatus,
      durationMs: Date.now() - startedMs,
      repositoryOutcome: "ok",
    });

    return {
      run,
      assembly,
      output,
      policy,
      presentation: null,
      cacheHit,
    };
  }

  private finalizeProviderOutput(
    output: import("../evidence/structured-output").BrainStructuredOutput,
    capabilityId: BrainCapabilityId,
    upstreamOutputs?: Partial<Record<BrainCapabilityId, import("../evidence/structured-output").BrainStructuredOutput>>
  ): import("../evidence/structured-output").BrainStructuredOutput {
    let finalized = collapseDuplicateFindings(output);
    assertValidBrainOutput(finalized);

    const qualityIssues = validateCapabilityOutputQuality({
      capabilityId,
      output: finalized,
      upstreamCapabilityIds: Object.keys(upstreamOutputs ?? {}) as BrainCapabilityId[],
    });
    if (qualityIssues.length > 0) {
      finalized = {
        ...finalized,
        warnings: [
          ...finalized.warnings,
          ...qualityIssues.map((q, i) => ({
            id: `quality-${i}`,
            code: q.code,
            message: q.message,
            provenance: [{ kind: "assumption" as const, refId: "quality-check" }],
          })),
        ],
      };
    }

    if (!outputHasCustomerExplanation(finalized)) {
      throw new BrainRuntimeError(
        "output_missing_explanation",
        "Output lacks customer-safe explanation."
      );
    }

    return finalized;
  }

  private executeProviderSync(input: {
    provider: BrainCapabilityProvider;
    runContext: BrainRunContext;
    projected: ReturnType<typeof projectBrainContext>;
    request: BrainRunRequestWithBudget;
    assembly: ContextAssemblyResult;
    capabilityId: BrainCapabilityId;
  }): import("../evidence/structured-output").BrainStructuredOutput {
    const executionContext = buildCapabilityExecutionContext({
      assembly: input.assembly,
      request: input.request,
    });
    const raw = input.provider.executeSync!({
      context: input.runContext,
      snapshot: input.projected.snapshot,
      capabilityId: input.capabilityId,
      companySnapshot: input.projected.companySnapshot,
      executionContext,
      projection: input.projected.projection,
    });
    return this.finalizeProviderOutput(raw, input.capabilityId, input.request.upstreamOutputs);
  }

  private async executeProviderAsync(input: {
    provider: BrainCapabilityProvider;
    runContext: BrainRunContext;
    projected: ReturnType<typeof projectBrainContext>;
    request: BrainRunRequestWithBudget;
    assembly: ContextAssemblyResult;
    capabilityId: BrainCapabilityId;
  }): Promise<import("../evidence/structured-output").BrainStructuredOutput> {
    const executionContext = buildCapabilityExecutionContext({
      assembly: input.assembly,
      request: input.request,
    });
    const raw = await input.provider.execute({
      context: input.runContext,
      snapshot: input.projected.snapshot,
      capabilityId: input.capabilityId,
      companySnapshot: input.projected.companySnapshot,
      executionContext,
      projection: input.projected.projection,
    });
    const validationIssues = validateBrainStructuredOutput(raw);
    if (validationIssues.length > 0) {
      assertValidBrainOutput(raw);
    }
    return this.finalizeProviderOutput(raw, input.capabilityId, input.request.upstreamOutputs);
  }

  private async submitRunAsync(
    request: BrainRunRequestWithBudget,
    requestHash?: string
  ): Promise<BrainRunSubmitResult> {
    if (request.idempotencyKey && this.deps.asyncRepositories) {
      const existing = await this.deps.asyncRepositories.idempotency.get(
        request.organizationId,
        request.capabilityId,
        request.idempotencyKey
      );
      if (existing) {
        if (requestHash && existing.requestHash !== requestHash) {
          throw new BrainRuntimeError(
            "idempotency_mismatch",
            "Idempotency key reused with different request payload."
          );
        }
        const run = await this.deps.asyncRepositories.runs.getById(request.organizationId, existing.runId);
        if (run) {
          return { runId: run.id, status: run.status, idempotentReplay: true };
        }
      }
    } else if (request.idempotencyKey) {
      return this.submitRun(request);
    }

    const run = initialRun(request);
    if (this.deps.asyncRepositories) {
      await this.deps.asyncRepositories.runs.create(run);
      if (request.idempotencyKey && requestHash) {
        await this.deps.asyncRepositories.idempotency.set({
          organizationId: request.organizationId,
          capabilityId: request.capabilityId,
          idempotencyKey: request.idempotencyKey,
          runId: run.id,
          requestHash,
          createdAt: new Date().toISOString(),
        });
      }
      return { runId: run.id, status: run.status, idempotentReplay: false };
    }

    return this.submitRun(request);
  }

  private async lookupRunAsync(organizationId: string, runId: string): Promise<BrainRunRecord> {
    if (this.deps.asyncRepositories) {
      const run = await this.deps.asyncRepositories.runs.getById(organizationId, runId);
      if (!run) throw new BrainRunNotFoundError(runId);
      assertRunOrganizationMatch(run, organizationId);
      return run;
    }
    return this.lookupRun(organizationId, runId);
  }

  private async transitionRunAsync(
    run: BrainRunRecord,
    to: BrainRunRecord["status"],
    patch: Partial<BrainRunRecord> = {}
  ): Promise<BrainRunRecord> {
    const status = transitionStatus(run.status, to);
    const updated = {
      ...run,
      ...patch,
      status,
      updatedAt: new Date().toISOString(),
    };
    if (this.deps.asyncRepositories) {
      return this.deps.asyncRepositories.runs.update(updated);
    }
    return this.deps.runRepository.update(updated);
  }

  private async getOutputAsync(
    organizationId: string,
    runId: string
  ): Promise<import("../evidence/structured-output").BrainStructuredOutput | null> {
    if (this.deps.asyncRepositories) {
      return this.deps.asyncRepositories.outputs.getByRunId(organizationId, runId);
    }
    return this.deps.outputRepository.getByRunId(organizationId, runId);
  }

  private async storeOutputAsync(input: {
    organizationId: string;
    runId: string;
    output: import("../evidence/structured-output").BrainStructuredOutput;
    storedAt: string;
    capabilityId: BrainCapabilityId;
    capabilityVersion: string;
    providerClass?: string;
    contentHash: string;
    contextHash?: string;
    snapshotVersion?: string;
    campaignId?: string;
  }): Promise<string> {
    if (this.deps.asyncRepositories) {
      return this.deps.asyncRepositories.outputs.store(input);
    }
    return this.deps.outputRepository.store({
      organizationId: input.organizationId,
      runId: input.runId,
      output: input.output,
      storedAt: input.storedAt,
    });
  }

  private async writeAuditAsync(
    run: BrainRunRecord,
    assembly: ContextAssemblyResult,
    projection: import("../providers/token-strategy").BrainContextProjection,
    policy: import("../policy/approval-policy").BrainPolicyResult,
    cacheHit: boolean,
    durationMs: number,
    output?: import("../evidence/structured-output").BrainStructuredOutput
  ): Promise<void> {
    const record = buildRunAuditRecord({
      run,
      assembly,
      projection,
      policy,
      output,
      providerId: run.usage.providerId ?? "unknown",
      cacheHit,
      durationMs,
    });
    if (this.deps.asyncRepositories) {
      await this.deps.asyncRepositories.audit.append(record);
    } else {
      this.deps.auditRepository.append(record);
    }
    void buildRunAuditMetadata({ assembly, projection, providerId: run.usage.providerId ?? "unknown", cacheHit, output });
  }

  private transitionRun(
    run: BrainRunRecord,
    to: BrainRunRecord["status"],
    patch: Partial<BrainRunRecord> = {}
  ): BrainRunRecord {
    const status = transitionStatus(run.status, to);
    return this.deps.runRepository.update({
      ...run,
      ...patch,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  private reconstructRequest(run: BrainRunRecord): BrainRunRequestWithBudget {
    return {
      organizationId: run.organizationId,
      peerId: run.peerId,
      capabilityId: run.capabilityId,
      actorId: "resume",
      campaignId: run.campaignId,
      environment: run.environment,
      correlationId: run.traceId,
    };
  }

  private writeAudit(
    run: BrainRunRecord,
    assembly: ContextAssemblyResult,
    projection: import("../providers/token-strategy").BrainContextProjection,
    policy: import("../policy/approval-policy").BrainPolicyResult,
    cacheHit: boolean,
    durationMs: number,
    output?: import("../evidence/structured-output").BrainStructuredOutput
  ): void {
    const record = buildRunAuditRecord({
      run,
      assembly,
      projection,
      policy,
      output,
      providerId: run.usage.providerId ?? "unknown",
      cacheHit,
      durationMs,
    });
    this.deps.auditRepository.append(record);
    void buildRunAuditMetadata({ assembly, projection, providerId: run.usage.providerId ?? "unknown", cacheHit, output });
  }
}

export function createBrainRuntime(deps: BrainRuntimeDeps): BrainRuntime {
  return new BrainRuntime(deps);
}
