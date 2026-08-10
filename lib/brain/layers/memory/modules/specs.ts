import type { MemoryDomainId } from "../types";

export type MemoryModuleSpec = {
  id: MemoryDomainId;
  title: string;
  purpose: string;
  layerOrder: number;
};

export const MEMORY_MODULE_SPECS: readonly MemoryModuleSpec[] = [
  { id: "business_memory", title: "Business Memory", purpose: "Products, services, USPs, markets, goals.", layerOrder: 1 },
  { id: "brand_memory", title: "Brand Memory", purpose: "Tone, style, visual identity, approved and forbidden claims.", layerOrder: 2 },
  { id: "audience_memory", title: "Audience Memory", purpose: "ICP, personas, pain points, objections, FAQs.", layerOrder: 3 },
  { id: "competitive_memory", title: "Competitive Memory", purpose: "Competitors, positioning, differentiators.", layerOrder: 4 },
  { id: "creative_memory", title: "Creative Memory", purpose: "Campaign concepts, winning hooks, rejected ideas.", layerOrder: 5 },
  { id: "validation_memory", title: "Validation Memory", purpose: "Approved/rejected assets, warnings, recurring issues.", layerOrder: 6 },
  { id: "execution_memory", title: "Execution Memory", purpose: "Published campaigns, schedules, channel history.", layerOrder: 7 },
  { id: "performance_memory", title: "Performance Memory", purpose: "CTR, ROAS, conversion, engagement, outcomes.", layerOrder: 8 },
  { id: "learning_memory", title: "Learning Memory", purpose: "Patterns, lessons, hypotheses, best practices.", layerOrder: 9 },
];

export const MEMORY_LAYER_ORDER: Readonly<Record<MemoryDomainId, number>> = Object.fromEntries(
  MEMORY_MODULE_SPECS.map((s) => [s.id, s.layerOrder])
) as Record<MemoryDomainId, number>;
