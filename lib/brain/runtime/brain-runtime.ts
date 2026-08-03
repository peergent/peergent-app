import type { BrainRunContext } from "../context/run-context";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainCacheStore } from "../cache/store";
import { buildCacheKey } from "../cache/store";
import { hashContextSlices } from "../providers/token-strategy";
import { resolveBrainEnvironment } from "../context/resolve-environment";
import { getBrainCapability } from "../capabilities/registry";
import { evaluateBrainPolicy } from "../policy/approval-policy";
import type { BrainRunRequestWithBudget } from "./run-request";
import type { BrainRunRecord } from "./repositories/contracts";
import type { BrainRunRepository } from "./repositories/contracts";
import type { BrainOutputRepository } from "./repositories/contracts";
import type { BrainAuditRepository } from "./repositories/contracts";
import type { BrainIdempotencyRepository } from "./repositories/contracts";
import type { BrainRunResult, BrainRunSubmitResult } from "./run-result";
import { transitionStatus } from "./state-machine";
import { BrainRunNotFoundError, BrainRuntimeError } from "./errors";
import {
  assertBudgetAllowed,
  createRunBudget,
  recordZeroProviderUsage,
  validateRuntimeBudget,
} from "./budget-validator";
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

export type BrainRuntimeDeps = {
  runRepository: BrainRunRepository;
  outputRepository: BrainOutputRepository;
  auditRepository: BrainAuditRepository;
  idempotencyRepository: BrainIdempotencyRepository;
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

    const output = provider.executeSync({
      context: runContext,
      snapshot: projected.snapshot,
      capabilityId: request.capabilityId,
      companySnapshot: projected.companySnapshot,
    });

    assertValidBrainOutput(output);

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

    let run: BrainRunRecord;
    if (existingRunId) {
      run = this.lookupRun(request.organizationId, existingRunId);
    } else {
      const submitted = this.submitRun(request);
      run = this.lookupRun(request.organizationId, submitted.runId);
      if (submitted.idempotentReplay && run.status === "completed") {
        const output = this.deps.outputRepository.getByRunId(request.organizationId, run.id);
        return {
          run,
          assembly: await Promise.resolve(this.deps.assembleContext(request)),
          output: output,
          policy: { decision: "allow", reason: "Idempotent replay." },
          presentation: null,
          cacheHit: Boolean(run.usage.cacheHit),
        };
      }
    }

    run = this.transitionRun(run, "gathering_context");

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
      run = this.transitionRun(run, status, {
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
      this.writeAudit(run, assembly, {
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

    const { provider, providerClass } = selectBrainProvider({
      environment,
      capabilityId: request.capabilityId,
      providers: this.deps.providers,
      costClass: capabilityDef.costClass,
    });

    const budgetCheck = validateRuntimeBudget({
      limits: request.budget,
      budget: run.budget,
      projection: projected.projection,
      orgRunCount: this.deps.runRepository.countByOrganization(request.organizationId),
      childRunCount: request.parentRunId
        ? this.deps.runRepository.countChildRuns(request.organizationId, request.parentRunId)
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
      run = this.transitionRun(run, "blocked", {
        policyDecision: policy.decision,
        readinessState: assembly.state,
        contextHash: projected.projection.contextHash,
        snapshotVersion: String(assembly.version.version),
        errorMessage: policy.reason,
      });
      return { run, assembly, output: null, policy, presentation: null, cacheHit: false };
    }

    run = this.transitionRun(run, "ready", {
      readinessState: assembly.state,
      contextHash: projected.projection.contextHash,
      snapshotVersion: String(assembly.version.version),
      policyDecision: policy.decision,
    });

    const payloadHash = hashContextSlices([request.payloadRefId ?? "none"]);
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

    run = this.transitionRun(run, "running");

    if (!output) {
      output = await provider.execute({
        context: runContext,
        snapshot: projected.snapshot,
        capabilityId: request.capabilityId,
        companySnapshot: projected.companySnapshot,
      });

      const validationIssues = validateBrainStructuredOutput(output);
      if (validationIssues.length > 0 && providerClass === "demo") {
        assertValidBrainOutput(output);
      }
      if (!outputHasCustomerExplanation(output)) {
        throw new BrainRuntimeError(
          "output_missing_explanation",
          "Output lacks customer-safe explanation."
        );
      }

      if (capabilityDef.cacheable && !cacheHit) {
        this.deps.cache.set(
          buildCacheKey(request.organizationId, request.capabilityId, cacheKey),
          output,
          projected.projection.contextHash,
          86_400_000
        );
      }
    }

    const usage = recordZeroProviderUsage(provider.id);
    usage.cacheHit = cacheHit;

    let finalStatus = readinessGate.partial ? "partial" : "completed";
    if (policy.decision === "require_approval" && output.actionProposals.some((a) => a.requiresApproval)) {
      finalStatus = "waiting_for_approval";
    }

    const outputId = this.deps.outputRepository.store({
      organizationId: request.organizationId,
      runId: run.id,
      output,
      storedAt: new Date().toISOString(),
    });

    run = this.transitionRun(run, finalStatus as typeof run.status, {
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

    this.writeAudit(run, assembly, projected.projection, policy, cacheHit, Date.now() - startedMs, output);

    return {
      run,
      assembly,
      output,
      policy,
      presentation: null,
      cacheHit,
    };
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
