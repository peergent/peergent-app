import {
  assessmentToBrainSnapshot,
  emptyBrainSnapshot,
  type BrainSnapshot,
} from "../adapters/brain/business-brain-adapter";
import { createSupabaseSource } from "../data/sources";
import { fetchLatestWebsiteIntelligenceAssessment } from "../data/website-intelligence-assessment";
import { createStubSource, type ContextLoader } from "./base";

function createBrainSource(
  assessment: { meta: { url: string; analyzedAt: string; companyName: string } },
  organizationId: string
) {
  return createSupabaseSource(
    "website_intelligence_assessments",
    `${organizationId}:${assessment.meta.analyzedAt}`,
    `${assessment.meta.companyName} · ${assessment.meta.url}`
  );
}

export const businessBrainLoader: ContextLoader<BrainSnapshot> = {
  key: "brain",
  layerKey: "brain",
  loadMode: "lazy",
  ttlMs: 60 * 60 * 1000,
  load: async ({ scope, supabase }) => {
    const organizationId = scope.organization.organizationId;

    if (!supabase && typeof window === "undefined") {
      return {
        key: "brain",
        data: emptyBrainSnapshot(),
        sources: [createStubSource("business-brain-loader-unavailable")],
        priority: 70,
        loadMode: "lazy",
      };
    }

    let loaded;
    try {
      loaded = await fetchLatestWebsiteIntelligenceAssessment(
        supabase,
        organizationId
      );
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Failed to load Business Brain assessment.");
    }

    if (!loaded) {
      return {
        key: "brain",
        data: emptyBrainSnapshot(),
        sources: [createStubSource("business-brain-loader-empty")],
        priority: 70,
        loadMode: "lazy",
      };
    }

    return {
      key: "brain",
      data: assessmentToBrainSnapshot(loaded.assessment),
      sources:
        loaded.source === "supabase"
          ? [createBrainSource(loaded.assessment, organizationId)]
          : [createStubSource("website-intelligence-session")],
      priority: 70,
      loadMode: "lazy",
    };
  },
};

export type { BrainSnapshot };
