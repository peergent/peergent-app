import type { BrainContextSlices } from "../../project-engine/brain-contract";
import type { ProjectBrainId } from "../../project-engine/types";
import type { ContextCategory, ContextRequirement } from "../types";

const BASE_ORG: ContextRequirement[] = [
  {
    id: "req-org-identity",
    category: "organization",
    key: "organization.identity",
    required: true,
    scope: "organization",
    reason: "Organization identity anchors all Brain reasoning.",
    mapsToSlice: "business",
  },
];

const BASE_PROJECT: ContextRequirement[] = [
  {
    id: "req-project-objective",
    category: "project",
    key: "project.objective",
    required: true,
    scope: "project",
    reason: "Project objective defines what success means.",
    mapsToSlice: "campaign",
  },
];

const PEER_ROLE_PROFILES: Record<
  string,
  { required: ContextRequirement[]; optional: ContextRequirement[] }
> = {
  Marketing: {
    required: [
      ...BASE_ORG,
      ...BASE_PROJECT,
      {
        id: "req-business-positioning",
        category: "business_brain",
        key: "business.positioning",
        required: true,
        scope: "organization",
        reason: "Positioning is required for marketing strategy.",
        mapsToSlice: "business",
      },
      {
        id: "req-business-products",
        category: "business_brain",
        key: "business.products",
        required: true,
        scope: "organization",
        reason: "Products or services define what is marketed.",
        mapsToSlice: "products",
      },
      {
        id: "req-business-audience",
        category: "business_brain",
        key: "business.target_audience",
        required: true,
        scope: "organization",
        reason: "Target audience is required for relevant campaigns.",
        mapsToSlice: "business",
      },
      {
        id: "req-dna-tone",
        category: "company_dna",
        key: "dna.tone_of_voice",
        required: false,
        scope: "organization",
        reason: "Brand tone improves creative quality.",
        mapsToSlice: "brand",
      },
      {
        id: "req-website-messaging",
        category: "website_intelligence",
        key: "website.messaging",
        required: false,
        scope: "organization",
        reason: "Website messaging aligns campaigns with public presence.",
        mapsToSlice: "website",
      },
      {
        id: "req-intelligence-competitors",
        category: "intelligence",
        key: "intelligence.competitors",
        required: false,
        scope: "organization",
        reason: "Competitor context improves positioning.",
        mapsToSlice: "competitors",
      },
      {
        id: "req-project-goals",
        category: "project",
        key: "project.goals",
        required: true,
        scope: "project",
        reason: "Campaign goals drive strategy and planning.",
        mapsToSlice: "goals",
      },
    ],
    optional: [
      {
        id: "req-memory-org",
        category: "memory",
        key: "memory.organization",
        required: false,
        scope: "organization",
        reason: "Prior organizational learnings improve outcomes.",
      },
      {
        id: "req-knowledge-sources",
        category: "knowledge",
        key: "knowledge.sources",
        required: false,
        scope: "organization",
        reason: "Uploaded knowledge can enrich context.",
      },
    ],
  },
  Sales: {
    required: [
      ...BASE_ORG,
      ...BASE_PROJECT,
      {
        id: "req-business-products",
        category: "business_brain",
        key: "business.products",
        required: true,
        scope: "organization",
        reason: "Sales requires product/service context.",
        mapsToSlice: "products",
      },
      {
        id: "req-business-audience",
        category: "business_brain",
        key: "business.target_audience",
        required: true,
        scope: "organization",
        reason: "Sales requires ICP / audience context.",
        mapsToSlice: "business",
      },
    ],
    optional: [
      {
        id: "req-intelligence-competitors",
        category: "intelligence",
        key: "intelligence.competitors",
        required: false,
        scope: "organization",
        reason: "Competitive context supports sales positioning.",
        mapsToSlice: "competitors",
      },
    ],
  },
  Support: {
    required: [
      ...BASE_ORG,
      {
        id: "req-knowledge-policies",
        category: "knowledge",
        key: "knowledge.policies",
        required: true,
        scope: "organization",
        reason: "Support requires policy and product knowledge.",
      },
    ],
    optional: [
      {
        id: "req-memory-org",
        category: "memory",
        key: "memory.organization",
        required: false,
        scope: "organization",
        reason: "Prior support learnings improve responses.",
      },
    ],
  },
};

const DEFAULT_PROFILE = PEER_ROLE_PROFILES.Marketing!;

export function resolveContextRequirements(input: {
  peerRole: string;
  phase?: ProjectBrainId | "project_start";
}): readonly ContextRequirement[] {
  const profile = PEER_ROLE_PROFILES[input.peerRole] ?? DEFAULT_PROFILE;
  const phaseExtras: ContextRequirement[] = [];

  if (input.phase === "strategy" || input.phase === "planning") {
    phaseExtras.push({
      id: "req-phase-goals",
      category: "project",
      key: "project.goals",
      required: true,
      scope: "project",
      reason: "Goals are required before strategy/planning.",
      mapsToSlice: "goals",
    });
  }

  const byId = new Map<string, ContextRequirement>();
  for (const req of [...profile.required, ...profile.optional, ...phaseExtras]) {
    byId.set(req.id, req);
  }
  return [...byId.values()];
}

export function requirementsForCategory(
  requirements: readonly ContextRequirement[],
  category: ContextCategory
): ContextRequirement[] {
  return requirements.filter((r) => r.category === category);
}

export function requiredSliceKeys(requirements: readonly ContextRequirement[]): (keyof BrainContextSlices)[] {
  const keys = new Set<keyof BrainContextSlices>();
  for (const req of requirements) {
    if (req.required && req.mapsToSlice) keys.add(req.mapsToSlice);
  }
  return [...keys];
}
