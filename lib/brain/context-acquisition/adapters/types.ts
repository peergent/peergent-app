import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type {
  AcquiredContextItem,
  ContextAcquisitionBudget,
  ContextCategory,
  ContextRequirement,
} from "../types";

export type ContextAdapterInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId?: string;
  peerId?: string;
  requirements: readonly ContextRequirement[];
  budget: ContextAcquisitionBudget;
  locale?: "nl" | "en";
  peerRole?: string;
  campaignContext?: import("@/lib/office/campaign/campaign-context").CampaignContext | null;
};

export type ContextAdapterResult = {
  adapterId: string;
  status: "completed" | "partial" | "failed" | "skipped";
  items: AcquiredContextItem[];
  failureCode?: string;
  failureMessage?: string;
  durationMs: number;
};

export interface ContextSourceAdapter {
  readonly id: string;
  readonly categories: readonly ContextCategory[];
  acquire(input: ContextAdapterInput): Promise<ContextAdapterResult>;
}
