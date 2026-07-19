import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import type { ContextPackage } from "@/lib/intelligence";
import type { ContextBundle } from "@/lib/context-engine/types";
import type { OrganizationSlice } from "@/lib/context-engine/types/organization";
import type { PeerIdentitySlice } from "@/lib/context-engine/types/peer";
import type { PolicySlice } from "@/lib/context-engine/loaders/preferences-loader";
import type { PromptContextSection } from "../types";
import type { BusinessBrainSectionKey, PeerPromptStrategy } from "../peer-strategies/base";
import { formatBulletList } from "../peer-strategies/base";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function buildIdentitySectionFromPackage(
  contextPackage: ContextPackage
): PromptContextSection | null {
  const data = contextPackage.slices.identity as PeerIdentitySlice | undefined;
  if (!data) return null;

  const lines = [
    `Name: ${data.name}`,
    `Role: ${data.role}`,
    data.roleFocus ? `Focus: ${data.roleFocus}` : null,
  ].filter(Boolean) as string[];

  return { key: "identity", title: "Identity", body: lines.join("\n") };
}

export function buildIdentitySection(bundle: ContextBundle): PromptContextSection | null {
  const slice = bundle.layers.identity;
  if (!slice) return null;
  const data = slice.data as PeerIdentitySlice;
  const lines = [
    `Name: ${data.name}`,
    `Role: ${data.role}`,
    data.roleFocus ? `Focus: ${data.roleFocus}` : null,
  ].filter(Boolean) as string[];
  return { key: "identity", title: "Identity", body: lines.join("\n") };
}

export function buildOrganizationSectionFromPackage(
  contextPackage: ContextPackage
): PromptContextSection | null {
  const data = contextPackage.slices.organization as OrganizationSlice | undefined;
  if (!data) return null;

  const lines = [
    `Organization: ${data.name}`,
    `Slug: ${data.slug}`,
    data.primaryWebsite ? `Primary website: ${data.primaryWebsite}` : null,
  ].filter(Boolean) as string[];

  return { key: "organization", title: "Organization", body: lines.join("\n") };
}

export function buildOrganizationSection(bundle: ContextBundle): PromptContextSection | null {
  const slice = bundle.layers.organization;
  if (!slice) return null;
  const data = slice.data as OrganizationSlice;
  const lines = [
    `Organization: ${data.name}`,
    `Slug: ${data.slug}`,
    data.primaryWebsite ? `Primary website: ${data.primaryWebsite}` : null,
  ].filter(Boolean) as string[];
  return { key: "organization", title: "Organization", body: lines.join("\n") };
}

export function buildObjectiveSectionFromPackage(
  contextPackage: ContextPackage,
  taskHint?: string
): PromptContextSection | null {
  const objective =
    (contextPackage.slices.objective as { objective?: string } | undefined)?.objective ??
    contextPackage.scope.peer.objective;

  if (!objective?.trim() && !taskHint?.trim()) return null;

  const lines = [
    objective?.trim() ? `Peer objective: ${objective.trim()}` : null,
    taskHint?.trim() ? `Current task hint: ${taskHint.trim()}` : null,
  ].filter(Boolean) as string[];

  return { key: "objective", title: "Objective", body: lines.join("\n") };
}

export function buildObjectiveSection(
  bundle: ContextBundle,
  taskHint?: string
): PromptContextSection | null {
  const slice = bundle.layers.objective;
  const objective =
    (slice?.data as { objective?: string } | undefined)?.objective ??
    bundle.scope.peer.objective;

  if (!objective?.trim() && !taskHint?.trim()) return null;

  const lines = [
    objective?.trim() ? `Peer objective: ${objective.trim()}` : null,
    taskHint?.trim() ? `Current task hint: ${taskHint.trim()}` : null,
  ].filter(Boolean) as string[];

  return { key: "objective", title: "Objective", body: lines.join("\n") };
}

export function buildCompanyDnaSection(
  dna: CompanyDnaContextSlice | undefined
): PromptContextSection | null {
  if (!dna?.available) return null;

  const lines: string[] = [];

  if (dna.mission?.trim()) lines.push(`Mission: ${dna.mission.trim()}`);
  if (dna.values.length > 0) {
    lines.push(
      `Values:\n${formatBulletList(dna.values.map((v) => (v.description ? `${v.name} — ${v.description}` : v.name)))}`
    );
  }
  if (dna.toneOfVoice.summary?.trim()) {
    lines.push(`Tone of voice: ${dna.toneOfVoice.summary.trim()}`);
  }
  if (dna.toneOfVoice.personality?.length) {
    lines.push(`Personality: ${dna.toneOfVoice.personality.join(", ")}`);
  }
  if (dna.riskProfile.summary?.trim()) {
    lines.push(`Risk profile: ${dna.riskProfile.summary.trim()}`);
  }
  if (dna.decisionPrinciples.length > 0) {
    lines.push(
      `Decision principles:\n${formatBulletList(dna.decisionPrinciples.map((p) => p.name))}`
    );
  }

  if (lines.length === 0) return null;

  return { key: "company-dna", title: "Company DNA", body: lines.join("\n\n") };
}

function formatBusinessBrainSection(
  brain: BusinessBrainContextSlice,
  section: BusinessBrainSectionKey
): string | null {
  switch (section) {
    case "products":
      if (brain.products.length === 0) return null;
      return `Products:\n${formatBulletList(brain.products.map((p) => (p.description ? `${p.name} — ${p.description}` : p.name)))}`;
    case "services":
      if (brain.services.length === 0) return null;
      return `Services:\n${formatBulletList(brain.services.map((s) => (s.description ? `${s.name} — ${s.description}` : s.name)))}`;
    case "customerSegments":
      if (brain.customerSegments.length === 0) return null;
      return `Customer segments:\n${formatBulletList(brain.customerSegments.map((s) => s.name))}`;
    case "competitors":
      if (brain.competitors.length === 0) return null;
      return `Competitors:\n${formatBulletList(brain.competitors.map((c) => c.name))}`;
    case "internalProcesses":
      if (brain.internalProcesses.length === 0) return null;
      return `Internal processes:\n${formatBulletList(brain.internalProcesses.map((p) => p.name))}`;
    case "knowledgeSources":
      if (brain.knowledgeSources.length === 0) return null;
      return `Knowledge sources:\n${formatBulletList(
        brain.knowledgeSources.map((s) => `${s.title} (${s.sourceType})`)
      )}`;
    case "facts":
      if (brain.facts.length === 0) return null;
      return `Business facts:\n${formatBulletList(
        brain.facts.map((f) => `${f.subject} ${f.predicate} ${f.value}`)
      )}`;
    default:
      return null;
  }
}

export function buildBusinessBrainSection(
  brain: BusinessBrainContextSlice | undefined,
  strategy: PeerPromptStrategy
): PromptContextSection | null {
  if (!brain?.available) return null;

  const lines = strategy.relevantBusinessBrainSections
    .map((section) => formatBusinessBrainSection(brain, section))
    .filter(Boolean) as string[];

  if (lines.length === 0) return null;

  if (brain.truncated) {
    lines.push("Note: additional business knowledge was omitted to fit context limits.");
  }

  return { key: "business-brain", title: "Business Brain", body: lines.join("\n\n") };
}

export function buildMarketingUnderstandingSection(
  understanding: MarketingUnderstandingContextSlice | undefined
): PromptContextSection | null {
  if (!understanding?.roleApplicable || !understanding.available) return null;

  const lines: string[] = [
    `Marketing understanding completeness: ${understanding.completeness}%`,
  ];

  const brand = understanding.brand;
  if (brand.positioningStatement?.trim()) {
    lines.push(`Positioning: ${brand.positioningStatement.trim()}`);
  }
  if (brand.valueProposition?.trim()) {
    lines.push(`Value proposition: ${brand.valueProposition.trim()}`);
  }
  if (brand.tagline?.trim()) {
    lines.push(`Tagline: ${brand.tagline.trim()}`);
  }
  if (brand.keyMessages.length > 0) {
    lines.push(`Key messages:\n${formatBulletList(brand.keyMessages)}`);
  }
  if (brand.marketCategory?.trim()) {
    lines.push(`Market category: ${brand.marketCategory.trim()}`);
  }
  if (brand.mission?.trim()) {
    lines.push(`Mission: ${brand.mission.trim()}`);
  }
  if (brand.toneOfVoice.summary?.trim()) {
    lines.push(`Brand tone: ${brand.toneOfVoice.summary.trim()}`);
  }

  if (understanding.products.length > 0) {
    lines.push(
      `Products:\n${formatBulletList(
        understanding.products.map((p) => (p.description ? `${p.name} — ${p.description}` : p.name))
      )}`
    );
  }
  if (understanding.services.length > 0) {
    lines.push(
      `Services:\n${formatBulletList(
        understanding.services.map((s) => (s.description ? `${s.name} — ${s.description}` : s.name))
      )}`
    );
  }
  if (understanding.customerSegments.length > 0) {
    lines.push(
      `Target audiences:\n${formatBulletList(
        understanding.customerSegments.map((segment) => {
          const pains =
            segment.painPoints.length > 0
              ? ` (pain points: ${segment.painPoints.join(", ")})`
              : "";
          return `${segment.name}${pains}`;
        })
      )}`
    );
  }
  if (understanding.competitors.length > 0) {
    lines.push(
      `Competitive landscape:\n${formatBulletList(
        understanding.competitors.map((c) => {
          const diff =
            c.differentiators.length > 0
              ? ` — differentiators: ${c.differentiators.join(", ")}`
              : "";
          return `${c.name}${diff}`;
        })
      )}`
    );
  }
  if (understanding.goals.length > 0) {
    lines.push(
      `Marketing goals:\n${formatBulletList(
        understanding.goals.map((goal) => {
          const timeframe = goal.timeframe ? ` (${goal.timeframe})` : "";
          return `${goal.title}${timeframe} [${goal.status}]`;
        })
      )}`
    );
  }
  if (understanding.existingContent.length > 0) {
    lines.push(
      `Existing content:\n${formatBulletList(
        understanding.existingContent.map((item) => {
          const channel = item.channel ? ` on ${item.channel}` : "";
          return `${item.title} (${item.contentType})${channel}`;
        })
      )}`
    );
  }

  if (understanding.gaps.length > 0) {
    lines.push(`Knowledge gaps: ${understanding.gaps.join(", ")}`);
  }

  if (lines.length <= 1) return null;

  return {
    key: "marketing-understanding",
    title: "Marketing Understanding",
    body: lines.join("\n\n"),
  };
}

export function buildPoliciesSectionFromPackage(
  contextPackage: ContextPackage
): PromptContextSection | null {
  const data = contextPackage.slices.policy as PolicySlice | undefined;
  if (!data) return null;

  const lines = [
    `Autonomy mode: ${data.autonomy}`,
    `Can act independently: ${data.canActIndependently ? "yes" : "no"}`,
    data.requiresApprovalFor.length > 0
      ? `Requires approval for:\n${formatBulletList(data.requiresApprovalFor)}`
      : null,
  ].filter(Boolean) as string[];

  return { key: "policy", title: "Policies", body: lines.join("\n") };
}

export function buildPoliciesSection(bundle: ContextBundle): PromptContextSection | null {
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
  return { key: "policy", title: "Policies", body: lines.join("\n") };
}

export function buildContextSectionsFromPackage(
  contextPackage: ContextPackage,
  strategy: PeerPromptStrategy,
  taskHint?: string
): PromptContextSection[] {
  const sections: Array<PromptContextSection | null> = [];

  if (strategy.promptLayers.includes("identity")) {
    sections.push(buildIdentitySectionFromPackage(contextPackage));
  }
  if (strategy.promptLayers.includes("organization")) {
    sections.push(buildOrganizationSectionFromPackage(contextPackage));
  }
  if (strategy.promptLayers.includes("objective")) {
    sections.push(buildObjectiveSectionFromPackage(contextPackage, taskHint));
  }
  if (strategy.promptLayers.includes("company-dna")) {
    sections.push(buildCompanyDnaSection(contextPackage.slices.companyDna));
  }
  if (strategy.promptLayers.includes("business-brain")) {
    sections.push(
      buildBusinessBrainSection(contextPackage.slices.businessBrain, strategy)
    );
  }
  if (strategy.promptLayers.includes("marketing-understanding")) {
    sections.push(
      buildMarketingUnderstandingSection(contextPackage.slices.marketingUnderstanding)
    );
  }
  if (strategy.promptLayers.includes("policy")) {
    sections.push(buildPoliciesSectionFromPackage(contextPackage));
  }

  return sections.filter((section): section is PromptContextSection => Boolean(section));
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
  if (strategy.promptLayers.includes("company-dna")) {
    sections.push(
      buildCompanyDnaSection(
        bundle.layers["company-dna"]?.data as CompanyDnaContextSlice | undefined
      )
    );
  }
  if (strategy.promptLayers.includes("business-brain")) {
    sections.push(
      buildBusinessBrainSection(
        bundle.layers["business-brain"]?.data as BusinessBrainContextSlice | undefined,
        strategy
      )
    );
  }
  if (strategy.promptLayers.includes("policy")) {
    sections.push(buildPoliciesSection(bundle));
  }

  return sections.filter((section): section is PromptContextSection => Boolean(section));
}

export function getLoadedLayerKeys(bundle: ContextBundle) {
  return Object.keys(bundle.layers) as Array<keyof ContextBundle["layers"]>;
}

export function layerDataSummary(bundle: ContextBundle, layerKey: string): unknown {
  return asRecord(bundle.layers[layerKey as keyof ContextBundle["layers"]]?.data);
}

/** @deprecated Use buildBusinessBrainSection with BusinessBrainContextSlice */
export function buildBusinessBrainSectionLegacy(): null {
  return null;
}
