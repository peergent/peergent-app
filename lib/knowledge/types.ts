import type { MarketingUnderstandingDimension } from "@/lib/marketing-intelligence";

export type KnowledgeSectionId =
  | "company-dna"
  | "brand-positioning"
  | "products"
  | "services"
  | "customer-segments"
  | "competitors"
  | "internal-processes"
  | "facts"
  | "knowledge-sources"
  | "marketing-goals"
  | "marketing-content";

export type KnowledgeSectionMeta = {
  id: KnowledgeSectionId;
  title: string;
  description: string;
  group: "company-dna" | "business-brain" | "marketing-profile";
};

export const KNOWLEDGE_SECTIONS: KnowledgeSectionMeta[] = [
  {
    id: "company-dna",
    title: "Company DNA",
    description: "Mission, values, tone, risk approach, and decision principles.",
    group: "company-dna",
  },
  {
    id: "brand-positioning",
    title: "Brand positioning",
    description: "Positioning statement, value proposition, and key messages.",
    group: "marketing-profile",
  },
  {
    id: "products",
    title: "Products",
    description: "What your company sells.",
    group: "business-brain",
  },
  {
    id: "services",
    title: "Services",
    description: "Services your company delivers.",
    group: "business-brain",
  },
  {
    id: "customer-segments",
    title: "Customer segments",
    description: "Who you serve and what they need.",
    group: "business-brain",
  },
  {
    id: "competitors",
    title: "Competitors",
    description: "Competitive landscape and differentiators.",
    group: "business-brain",
  },
  {
    id: "internal-processes",
    title: "Internal processes",
    description: "How work gets done inside the company.",
    group: "business-brain",
  },
  {
    id: "facts",
    title: "Business facts",
    description: "Verified facts the AI team can rely on.",
    group: "business-brain",
  },
  {
    id: "knowledge-sources",
    title: "Knowledge sources",
    description: "Documents and sources that ground answers.",
    group: "business-brain",
  },
  {
    id: "marketing-goals",
    title: "Marketing goals",
    description: "Active marketing objectives.",
    group: "marketing-profile",
  },
  {
    id: "marketing-content",
    title: "Existing content",
    description: "Published or planned marketing content.",
    group: "marketing-profile",
  },
];

export function gapToKnowledgeSection(
  gap: MarketingUnderstandingDimension
): KnowledgeSectionId {
  const map: Record<MarketingUnderstandingDimension, KnowledgeSectionId> = {
    companyDna: "company-dna",
    brandPositioning: "brand-positioning",
    products: "products",
    services: "services",
    customerSegments: "customer-segments",
    competitors: "competitors",
    goals: "marketing-goals",
    existingContent: "marketing-content",
  };
  return map[gap];
}

export function knowledgeSectionHref(section: KnowledgeSectionId): string {
  return `/knowledge?section=${section}`;
}

export function parseKnowledgeSection(value: string | null): KnowledgeSectionId {
  const valid = KNOWLEDGE_SECTIONS.some((s) => s.id === value);
  return valid ? (value as KnowledgeSectionId) : "company-dna";
}
