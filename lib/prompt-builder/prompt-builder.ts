import type { ContextPackage } from "@/lib/intelligence";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import {
  assessStrategyReadiness,
  buildMarketingStrategyTaskAppendix,
  MARKETING_STRATEGY_BEHAVIORAL_INSTRUCTIONS,
} from "@/lib/marketing-intelligence/strategy";
import {
  assessPlanReadiness,
  buildMarketingPlanTaskAppendix,
  MARKETING_PLAN_BEHAVIORAL_INSTRUCTIONS,
} from "@/lib/marketing-intelligence/plan";
import {
  assessContentDraftReadiness,
  buildMarketingContentTaskAppendix,
  MARKETING_CONTENT_BEHAVIORAL_INSTRUCTIONS,
} from "@/lib/marketing-intelligence/content";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { ContextBundle, ContextLayerKey } from "@/lib/context-engine/types";
import {
  ANTI_FABRICATION_INSTRUCTION,
  formatBulletList,
  getSharedBehavioralInstructions,
  joinParagraphs,
} from "./peer-strategies/base";
import { resolvePeerStrategy } from "./peer-strategies";
import { buildContextSections, buildContextSectionsFromPackage } from "./section-builders";
import type {
  PromptBuilderOptions,
  PromptPackage,
  PromptPackageMetadata,
} from "./types";
import { PROMPT_LAYER_ORDER, PROMPT_SECURITY_EXCLUDED_LAYERS } from "./types";

function collectWarningsFromPackage(contextPackage: ContextPackage): string[] {
  return [...new Set(contextPackage.meta.warnings)];
}

function collectWarnings(
  bundle: ContextBundle,
  strategy: ReturnType<typeof resolvePeerStrategy>
): string[] {
  const warnings: string[] = [];
  const dna = bundle.layers["company-dna"]?.data as CompanyDnaContextSlice | undefined;
  const brain = bundle.layers["business-brain"]?.data as BusinessBrainContextSlice | undefined;

  if (!dna?.available) warnings.push("Company DNA unavailable or empty");
  if (!brain?.available) warnings.push("Business Brain unavailable");
  else if (brain.sparse) warnings.push("Business Brain is sparse — limited business knowledge");
  if (brain?.truncated) warnings.push("Business Brain retrieval was truncated");

  if (!bundle.layers.knowledge) warnings.push("Knowledge layer not loaded");
  if (!bundle.layers.objective) warnings.push("Objective layer missing");
  if (!bundle.layers.policy) warnings.push("Policy layer missing");

  for (const layer of strategy.alwaysExcludeLayers) {
    if (layer === "telemetry") continue;
    if (!bundle.layers[layer] && bundle.meta.pendingLazyLayers.includes(layer)) {
      warnings.push(`${layer} layer not loaded`);
    }
  }

  return [...new Set(warnings)];
}

function buildSystemPrompt(
  strategy: ReturnType<typeof resolvePeerStrategy>,
  contextSections: PromptPackage["contextSections"],
  warnings: string[],
  outputFormat: PromptBuilderOptions["outputFormat"] = "default"
): string {
  const behavioralInstructions =
    outputFormat === "marketing-strategy"
      ? [
          ...getSharedBehavioralInstructions(),
          ...strategy.behavioralInstructions,
          ...MARKETING_STRATEGY_BEHAVIORAL_INSTRUCTIONS,
          ANTI_FABRICATION_INSTRUCTION,
        ]
      : outputFormat === "marketing-plan"
        ? [
            ...getSharedBehavioralInstructions(),
            ...strategy.behavioralInstructions,
            ...MARKETING_PLAN_BEHAVIORAL_INSTRUCTIONS,
            ANTI_FABRICATION_INSTRUCTION,
          ]
        : outputFormat === "marketing-content-draft"
          ? [
              ...getSharedBehavioralInstructions(),
              ...strategy.behavioralInstructions,
              ...MARKETING_CONTENT_BEHAVIORAL_INSTRUCTIONS,
              ANTI_FABRICATION_INSTRUCTION,
            ]
          : [
              ...getSharedBehavioralInstructions(),
              ...strategy.behavioralInstructions,
              ANTI_FABRICATION_INSTRUCTION,
            ];

  const contextBlock = contextSections
    .map((section) => `## ${section.title}\n${section.body}`)
    .join("\n\n");

  return joinParagraphs([
    strategy.roleDescription,
    `Default priorities:\n${formatBulletList(strategy.defaultPriorities)}`,
    `Behavior:\n${formatBulletList(behavioralInstructions)}`,
    warnings.length > 0 ? `Context gaps:\n${formatBulletList(warnings)}` : null,
    contextBlock ? `Verified business context:\n${contextBlock}` : null,
  ]);
}

function buildTaskPromptFromScope(
  scope: ContextBundle["scope"] | ContextPackage["scope"],
  objectiveData: { objective?: string } | undefined,
  strategy: ReturnType<typeof resolvePeerStrategy>,
  taskHint?: string,
  options?: Pick<
    PromptBuilderOptions,
    "outputFormat" | "marketingStrategy" | "marketingPlan" | "planActivityReference"
  > & {
    marketingUnderstanding?: MarketingUnderstandingContextSlice;
    contextPackage?: ContextPackage;
  }
): string {
  const objective = objectiveData?.objective ?? scope.peer.objective;
  const task = taskHint?.trim() || objective?.trim() || "Support the team with the peer objective.";

  const base = joinParagraphs([
    `Task for ${scope.peer.name} (${strategy.role}): ${task}`,
    `Focus on: ${strategy.defaultPriorities.join(", ")}.`,
    ANTI_FABRICATION_INSTRUCTION,
  ]);

  if (options?.outputFormat === "marketing-strategy") {
    const readiness = assessStrategyReadiness(options.marketingUnderstanding);
    return joinParagraphs([base, buildMarketingStrategyTaskAppendix(readiness)]);
  }

  if (options?.outputFormat === "marketing-plan") {
    if (!options.marketingStrategy) {
      return joinParagraphs([
        base,
        "Error: Marketing Strategy is required to generate a Marketing Plan.",
      ]);
    }
    const readiness = assessPlanReadiness(options.marketingStrategy);
    return joinParagraphs([
      base,
      buildMarketingPlanTaskAppendix(options.marketingStrategy, readiness),
    ]);
  }

  if (options?.outputFormat === "marketing-content-draft") {
    if (!options.marketingPlan || !options.planActivityReference?.trim()) {
      return joinParagraphs([
        base,
        "Error: Marketing Plan and planActivityReference are required for content creation.",
      ]);
    }
    if (!options.contextPackage) {
      return joinParagraphs([base, "Error: Context package is required for content creation."]);
    }
    const readiness = assessContentDraftReadiness(
      options.marketingPlan,
      options.planActivityReference,
      options.contextPackage
    );
    if (!readiness.ready || !readiness.activity || !readiness.normalizedContentType) {
      return joinParagraphs([
        base,
        `Error: ${readiness.warnings.join(" ")}`,
      ]);
    }
    return joinParagraphs([
      base,
      buildMarketingContentTaskAppendix(
        options.marketingPlan,
        readiness.activity,
        readiness.normalizedContentType
      ),
    ]);
  }

  return base;
}

function resolveLayerSets(
  loadedLayerKeys: ContextLayerKey[],
  strategy: ReturnType<typeof resolvePeerStrategy>,
  sections: PromptPackage["contextSections"]
) {
  const includedLayers = sections
    .map((section) => section.key)
    .filter((key): key is ContextLayerKey =>
      PROMPT_LAYER_ORDER.includes(key as ContextLayerKey)
    );

  const excludedLayers = [
    ...PROMPT_SECURITY_EXCLUDED_LAYERS,
    ...strategy.alwaysExcludeLayers,
    ...PROMPT_LAYER_ORDER.filter((layer) => !includedLayers.includes(layer)),
    ...loadedLayerKeys.filter(
      (layer) =>
        !includedLayers.includes(layer) &&
        !PROMPT_SECURITY_EXCLUDED_LAYERS.includes(layer)
    ),
  ];

  return {
    includedLayers: [...new Set(includedLayers)],
    excludedLayers: [...new Set(excludedLayers)],
  };
}

function buildMetadata(
  scope: ContextPackage["scope"],
  traceId: string,
  prompt: Pick<PromptPackage, "systemPrompt" | "taskPrompt" | "contextSections">
): PromptPackageMetadata {
  const estimatedCharacterCount =
    prompt.systemPrompt.length +
    prompt.taskPrompt.length +
    prompt.contextSections.reduce((total, section) => total + section.body.length, 0);

  return {
    organizationId: scope.organization.organizationId,
    peerId: scope.peer.peerId,
    peerRole: scope.peer.role,
    traceId,
    generatedAt: new Date().toISOString(),
    estimatedCharacterCount,
  };
}

/** Primary entry point — consumes Context Package from Context Engine v2. */
export function buildPrompt(
  contextPackage: ContextPackage,
  options: PromptBuilderOptions = {}
): PromptPackage {
  const strategy = resolvePeerStrategy(contextPackage.scope.peer.role);
  const taskHint = options.taskHint ?? contextPackage.taskHint;
  const warnings = collectWarningsFromPackage(contextPackage);
  const contextSections = buildContextSectionsFromPackage(
    contextPackage,
    strategy,
    taskHint
  );
  const { includedLayers, excludedLayers } = resolveLayerSets(
    contextPackage.meta.loadedLayers as ContextLayerKey[],
    strategy,
    contextSections
  );

  const systemPrompt = buildSystemPrompt(
    strategy,
    contextSections,
    warnings,
    options.outputFormat
  );
  const taskPrompt = buildTaskPromptFromScope(
    contextPackage.scope,
    contextPackage.slices.objective as { objective?: string } | undefined,
    strategy,
    taskHint,
    {
      outputFormat: options.outputFormat,
      marketingUnderstanding: contextPackage.slices
        .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined,
      marketingStrategy: options.marketingStrategy,
      marketingPlan: options.marketingPlan,
      planActivityReference: options.planActivityReference,
      contextPackage,
    }
  );

  const metadata = buildMetadata(contextPackage.scope, contextPackage.traceId, {
    systemPrompt,
    taskPrompt,
    contextSections,
  });

  return {
    systemPrompt,
    taskPrompt,
    contextSections,
    includedLayers,
    excludedLayers,
    warnings,
    metadata,
  };
}

/** @deprecated Use buildPrompt(ContextPackage). Kept for dev fixtures during migration. */
export function buildPromptPackage(
  bundle: ContextBundle,
  options: PromptBuilderOptions = {}
): PromptPackage {
  const strategy = resolvePeerStrategy(bundle.scope.peer.role);
  const warnings = collectWarnings(bundle, strategy);
  const contextSections = buildContextSections(bundle, strategy, options.taskHint);
  const { includedLayers, excludedLayers } = resolveLayerSets(
    Object.keys(bundle.layers) as ContextLayerKey[],
    strategy,
    contextSections
  );

  const systemPrompt = buildSystemPrompt(strategy, contextSections, warnings);
  const taskPrompt = buildTaskPromptFromScope(
    bundle.scope,
    bundle.layers.objective?.data as { objective?: string } | undefined,
    strategy,
    options.taskHint
  );

  const metadata = buildMetadata(bundle.scope, bundle.meta.traceId, {
    systemPrompt,
    taskPrompt,
    contextSections,
  });

  return {
    systemPrompt,
    taskPrompt,
    contextSections,
    includedLayers,
    excludedLayers,
    warnings,
    metadata,
  };
}

export function formatPromptForCopy(prompt: PromptPackage): string {
  const sections = prompt.contextSections
    .map((section) => `## ${section.title}\n${section.body}`)
    .join("\n\n");

  return [
    "# System Prompt",
    prompt.systemPrompt,
    "",
    "# Task Prompt",
    prompt.taskPrompt,
    sections ? "\n# Context Sections\n" + sections : "",
  ]
    .filter(Boolean)
    .join("\n");
}
