import type { BrainSnapshot } from "@/lib/context-engine/adapters/brain/business-brain-adapter";
import type { ContextBundle } from "@/lib/context-engine/types";
import type { OrganizationSlice } from "@/lib/context-engine/types/organization";
import type { PeerIdentitySlice } from "@/lib/context-engine/types/peer";
import type { PolicySlice } from "@/lib/context-engine/loaders/preferences-loader";
import type { PromptContextSection } from "../types";
import type { PeerPromptStrategy } from "../peer-strategies/base";
import { formatBulletList } from "../peer-strategies/base";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function buildIdentitySection(
  bundle: ContextBundle
): PromptContextSection | null {
  const slice = bundle.layers.identity;
  if (!slice) return null;

  const data = slice.data as PeerIdentitySlice;
  const lines = [
    `Name: ${data.name}`,
    `Role: ${data.role}`,
    data.roleFocus ? `Focus: ${data.roleFocus}` : null,
  ].filter(Boolean) as string[];

  return {
    key: "identity",
    title: "Identity",
    body: lines.join("\n"),
  };
}

export function buildOrganizationSection(
  bundle: ContextBundle
): PromptContextSection | null {
  const slice = bundle.layers.organization;
  if (!slice) return null;

  const data = slice.data as OrganizationSlice;
  const lines = [
    `Organization: ${data.name}`,
    `Slug: ${data.slug}`,
    data.primaryWebsite ? `Primary website: ${data.primaryWebsite}` : null,
  ].filter(Boolean) as string[];

  return {
    key: "organization",
    title: "Organization",
    body: lines.join("\n"),
  };
}

export function buildObjectiveSection(
  bundle: ContextBundle,
  taskHint?: string
): PromptContextSection | null {
  const slice = bundle.layers.objective;
  const objective =
    (slice?.data as { objective?: string } | undefined)?.objective ??
    bundle.scope.peer.objective;

  if (!objective?.trim() && !taskHint?.trim()) {
    return null;
  }

  const lines = [
    objective?.trim() ? `Peer objective: ${objective.trim()}` : null,
    taskHint?.trim() ? `Current task hint: ${taskHint.trim()}` : null,
  ].filter(Boolean) as string[];

  return {
    key: "objective",
    title: "Objective",
    body: lines.join("\n"),
  };
}

const BRAIN_FIELD_LABELS: Partial<Record<keyof BrainSnapshot, string>> = {
  companySummary: "Company summary",
  industry: "Industry",
  products: "Products",
  services: "Services",
  targetCustomers: "Target customers",
  valueProposition: "Value proposition",
  toneOfVoice: "Tone of voice",
  strengths: "Strengths",
  weaknesses: "Weaknesses",
  opportunities: "Opportunities",
  recommendations: "Recommendations",
};

export function buildBusinessBrainSection(
  bundle: ContextBundle,
  strategy: PeerPromptStrategy
): PromptContextSection | null {
  const slice = bundle.layers.brain;
  if (!slice) return null;

  const brain = slice.data as BrainSnapshot;
  if (!brain.available) return null;

  const lines: string[] = [];

  for (const field of strategy.relevantBrainFields) {
    if (strategy.excludedBrainFields.includes(field)) {
      continue;
    }

    const label = BRAIN_FIELD_LABELS[field] ?? field;
    const value = brain[field];

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${label}:\n${formatBulletList(value)}`);
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      lines.push(`${label}: ${value.trim()}`);
    }
  }

  if (lines.length === 0) {
    return null;
  }

  return {
    key: "brain",
    title: "Business Brain",
    body: lines.join("\n\n"),
  };
}

export function buildPoliciesSection(
  bundle: ContextBundle
): PromptContextSection | null {
  const slice = bundle.layers.policy;
  if (!slice) return null;

  const data = slice.data as PolicySlice;
  const lines = [
    `Autonomy mode: ${data.autonomy}`,
    `Can act independently: ${data.canActIndependently ? "yes" : "no"}`,
    data.requiresApprovalFor.length > 0
      ? `Requires approval for:\n${formatBulletList(data.requiresApprovalFor)}`
      : null,
  ].filter(Boolean) as string[];

  return {
    key: "policy",
    title: "Policies",
    body: lines.join("\n"),
  };
}

export function buildTaskSection(
  bundle: ContextBundle,
  taskHint?: string
): PromptContextSection | null {
  const hint = taskHint?.trim() || bundle.scope.peer.objective?.trim();
  if (!hint) return null;

  return {
    key: "task",
    title: "Task",
    body: `Work on the following task for ${bundle.scope.peer.name}: ${hint}`,
  };
}

export function buildContextSections(
  bundle: ContextBundle,
  strategy: PeerPromptStrategy,
  taskHint?: string
): PromptContextSection[] {
  const sections: Array<PromptContextSection | null> = [];

  if (strategy.promptLayers.includes("identity")) {
    sections.push(buildIdentitySection(bundle));
  }
  if (strategy.promptLayers.includes("organization")) {
    sections.push(buildOrganizationSection(bundle));
  }
  if (strategy.promptLayers.includes("objective")) {
    sections.push(buildObjectiveSection(bundle, taskHint));
  }
  if (strategy.promptLayers.includes("brain")) {
    sections.push(buildBusinessBrainSection(bundle, strategy));
  }
  if (strategy.promptLayers.includes("policy")) {
    sections.push(buildPoliciesSection(bundle));
  }

  sections.push(buildTaskSection(bundle, taskHint));

  return sections.filter((section): section is PromptContextSection => Boolean(section));
}

export function getLoadedLayerKeys(bundle: ContextBundle) {
  return Object.keys(bundle.layers) as Array<keyof ContextBundle["layers"]>;
}

export function layerDataSummary(bundle: ContextBundle, layerKey: string): unknown {
  return asRecord(bundle.layers[layerKey as keyof ContextBundle["layers"]]?.data);
}
