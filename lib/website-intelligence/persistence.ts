import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAssessmentForHire } from "@/lib/hire-team/hire-team-storage";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { WebsiteIntelligenceAssessment } from "./types";

type AppSupabaseClient = SupabaseClient<Database>;

type StoredAssessmentRow = {
  assessment: Json;
  analyzed_at: string;
  source_url: string;
  created_at: string;
};

export type WebsiteIntelligenceAssessmentSource = "supabase" | "session";

export type LoadedWebsiteIntelligenceAssessment = {
  assessment: WebsiteIntelligenceAssessment;
  source: WebsiteIntelligenceAssessmentSource;
  analyzedAt: string;
  createdAt?: string;
};

function isAssessment(value: unknown): value is WebsiteIntelligenceAssessment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WebsiteIntelligenceAssessment>;
  return Boolean(
    candidate.meta?.url &&
      candidate.meta?.analyzedAt &&
      candidate.executiveSummary &&
      candidate.companyDna
  );
}

function normalizeAssessmentRow(
  row: StoredAssessmentRow
): WebsiteIntelligenceAssessment {
  if (!isAssessment(row.assessment)) {
    throw new Error("Stored Website Intelligence assessment payload is invalid.");
  }

  return {
    ...row.assessment,
    meta: {
      ...row.assessment.meta,
      analyzedAt: row.assessment.meta.analyzedAt || row.analyzed_at,
      url: row.assessment.meta.url || row.source_url,
    },
  };
}

function loadSessionAssessment(): WebsiteIntelligenceAssessment | null {
  if (typeof window === "undefined") {
    return null;
  }

  return loadAssessmentForHire();
}

export async function saveWebsiteIntelligenceAssessment(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessment: WebsiteIntelligenceAssessment
): Promise<void> {
  const { error } = await supabase.from("website_intelligence_assessments").insert({
    organization_id: organizationId,
    source_url: assessment.meta.url,
    analyzed_at: assessment.meta.analyzedAt,
    assessment: assessment as unknown as Json,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchLatestWebsiteIntelligenceAssessment(
  supabase: AppSupabaseClient | undefined,
  organizationId: string
): Promise<LoadedWebsiteIntelligenceAssessment | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("website_intelligence_assessments")
      .select("assessment, analyzed_at, source_url, created_at")
      .eq("organization_id", organizationId)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load Website Intelligence assessment: ${error.message}`
      );
    }

    if (data) {
      const assessment = normalizeAssessmentRow(data as StoredAssessmentRow);
      return {
        assessment,
        source: "supabase",
        analyzedAt: data.analyzed_at,
        createdAt: data.created_at,
      };
    }
  }

  const sessionAssessment = loadSessionAssessment();
  if (!sessionAssessment) {
    return null;
  }

  return {
    assessment: sessionAssessment,
    source: "session",
    analyzedAt: sessionAssessment.meta.analyzedAt,
  };
}
