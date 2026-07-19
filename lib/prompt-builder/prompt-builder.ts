import type { BrainSnapshot } from "@/lib/context-engine/adapters/brain/business-brain-adapter";
import type { ContextBundle, ContextLayerKey } from "@/lib/context-engine/types";
import {
  ANTI_FABRICATION_INSTRUCTION,
  formatBulletList,
  getSharedBehavioralInstructions,
  joinParagraphs,
} from "./peer-strategies/base";
import { resolvePeerStrategy } from "./peer-strategies";
import { buildContextSections } from "./section-builders";
import type {
  PromptBuilderOptions,
  PromptPackage,
  PromptPackageMetadata,
} from "./types";
import { PROMPT_LAYER_ORDER, PROMPT_SECURITY_EXCLUDED_LAYERS } from "./types";

function collectWarnings(
  bundle: ContextBundle,
  strategy: ReturnType<typeof resolvePeerStrategy>
): string[] {
  const warnings: string[] = [];
  const brain = bundle.layers.brain?.data as BrainSnapshot | undefined;

  if (!brain?.available) {
    warnings.push("Business Brain unavailable");
  } else {
    if (!brain.targetCustomers?.trim()) {
      warnings.push("Target customers missing");
    }

    if (!brain.products || brain.products.length === 0) {
      warnings.push("No products identified");
    }
  }

  if (!bundle.layers.knowledge) {
    warnings.push("Knowledge layer not loaded");
  }

  if (!bundle.layers.objective) {
    warnings.push("Objective layer missing");
  }

  if (!bundle.layers.policy) {
    warnings.push("Policy layer missing");
  }

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
  warnings: string[]
): string {
  const contextBlock = contextSections
    .map((section) => `## ${section.title}\n${section.body}`)
    .join("\n\n");

  return joinParagraphs([
    strategy.roleDescription,
    `Default priorities:\n${formatBulletList(strategy.defaultPriorities)}`,
    `Behavior:\n${formatBulletList([
      ...getSharedBehavioralInstructions(),
      ...strategy.behavioralInstructions,
      ANTI_FABRICATION_INSTRUCTION,
    ])}`,
    warnings.length > 0
      ? `Context gaps:\n${formatBulletList(warnings)}`
      : null,
    contextBlock ? `Verified business context:\n${contextBlock}` : null,
  ]);
}

function buildTaskPrompt(
  bundle: ContextBundle,
  strategy: ReturnType<typeof resolvePeerStrategy>,
  taskHint?: string
): string {
  const objective =
    (bundle.layers.objective?.data as { objective?: string } | undefined)?.objective ??
    bundle.scope.peer.objective;
  const task = taskHint?.trim() || objective?.trim() || "Support the team with the peer objective.";

  return joinParagraphs([
    `Task for ${bundle.scope.peer.name} (${strategy.role}): ${task}`,
    `Focus on: ${strategy.defaultPriorities.join(", ")}.`,
    ANTI_FABRICATION_INSTRUCTION,
  ]);
}

function resolveLayerSets(
  bundle: ContextBundle,
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
    ...(Object.keys(bundle.layers) as ContextLayerKey[]).filter(
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
  bundle: ContextBundle,
  prompt: Pick<PromptPackage, "systemPrompt" | "taskPrompt" | "contextSections">
): PromptPackageMetadata {
  const estimatedCharacterCount =
    prompt.systemPrompt.length +
    prompt.taskPrompt.length +
    prompt.contextSections.reduce((total, section) => total + section.body.length, 0);

  return {
    organizationId: bundle.scope.organization.organizationId,
    peerId: bundle.scope.peer.peerId,
    peerRole: bundle.scope.peer.role,
    traceId: bundle.meta.traceId,
    generatedAt: new Date().toISOString(),
    estimatedCharacterCount,
  };
}

export function buildPromptPackage(
  bundle: ContextBundle,
  options: PromptBuilderOptions = {}
): PromptPackage {
  const strategy = resolvePeerStrategy(bundle.scope.peer.role);
  const warnings = collectWarnings(bundle, strategy);
  const contextSections = buildContextSections(bundle, strategy, options.taskHint);
  const { includedLayers, excludedLayers } = resolveLayerSets(
    bundle,
    strategy,
    contextSections
  );

  const systemPrompt = buildSystemPrompt(strategy, contextSections, warnings);
  const taskPrompt = buildTaskPrompt(bundle, strategy, options.taskHint);

  const metadata = buildMetadata(bundle, {
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
