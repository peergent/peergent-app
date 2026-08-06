import type { BrandConceptDomain, BrandConceptId } from "./types";

export type BrandConceptDefinition = {
  readonly id: BrandConceptId;
  readonly label: string;
  readonly domain: BrandConceptDomain;
  readonly description: string;
};

export const BRAND_CONCEPT_DEFINITIONS: readonly BrandConceptDefinition[] = [
  { id: "mission", label: "Mission", domain: "foundation", description: "Why the company exists." },
  { id: "vision", label: "Vision", domain: "foundation", description: "Where the company is going." },
  { id: "values", label: "Values", domain: "foundation", description: "Core principles that guide decisions." },
  { id: "personality", label: "Personality", domain: "foundation", description: "Human character of the brand." },
  { id: "audience", label: "Audience", domain: "foundation", description: "Primary audience the brand speaks to." },
  { id: "tone_of_voice", label: "Tone of Voice", domain: "voice", description: "How the brand sounds in communication." },
  { id: "writing_style", label: "Writing Style", domain: "voice", description: "Grammar, structure, and language patterns." },
  { id: "messaging", label: "Messaging", domain: "voice", description: "Core messages and narrative themes." },
  { id: "visual_identity", label: "Visual Identity", domain: "visual", description: "Overall visual language and identity system." },
  { id: "color_system", label: "Color System", domain: "visual", description: "Brand color palette and usage rules." },
  { id: "typography", label: "Typography", domain: "visual", description: "Typefaces and typographic hierarchy." },
  { id: "spacing", label: "Spacing", domain: "visual", description: "Spatial rhythm and layout spacing rules." },
  { id: "photography", label: "Photography", domain: "visual", description: "Photography style and subject guidance." },
  { id: "illustration", label: "Illustration", domain: "visual", description: "Illustration style and usage." },
  { id: "motion", label: "Motion", domain: "visual", description: "Animation and motion principles." },
  { id: "buttons", label: "Buttons", domain: "components", description: "Button styles and interaction patterns." },
  { id: "icons", label: "Icons", domain: "components", description: "Icon style and usage conventions." },
  { id: "cta_style", label: "CTA Style", domain: "components", description: "Call-to-action patterns and language." },
  { id: "layouts", label: "Layouts", domain: "components", description: "Layout patterns and grid conventions." },
  { id: "email_style", label: "Email Style", domain: "channel_styles", description: "Email-specific brand expression." },
  { id: "social_style", label: "Social Style", domain: "channel_styles", description: "Social channel brand expression." },
  { id: "advertising_style", label: "Advertising Style", domain: "channel_styles", description: "Paid media brand expression." },
  { id: "design_principles", label: "Design Principles", domain: "governance", description: "Guiding design decision principles." },
  { id: "brand_rules", label: "Brand Rules", domain: "governance", description: "Do's, don'ts, and guardrails." },
] as const;

export const ALL_BRAND_CONCEPT_IDS: readonly BrandConceptId[] = BRAND_CONCEPT_DEFINITIONS.map(
  (c) => c.id
);

export function getBrandConceptDefinition(id: BrandConceptId): BrandConceptDefinition {
  const found = BRAND_CONCEPT_DEFINITIONS.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown brand concept: ${id}`);
  }
  return found;
}

export function listBrandConceptsByDomain(domain: BrandConceptDomain): readonly BrandConceptDefinition[] {
  return BRAND_CONCEPT_DEFINITIONS.filter((c) => c.domain === domain);
}
