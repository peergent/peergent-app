import type { Database } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type {
  CreateMarketingGoalInput,
  MarketingGoal,
  UpdateMarketingGoalInput,
} from "../types";
import { parseGoalStatus } from "./mappers";

type MarketingGoalRow = Database["public"]["Tables"]["marketing_goals"]["Row"];

function mapRow(row: MarketingGoalRow): MarketingGoal {
  return {
    id: row.id,
    marketingProfileId: row.marketing_profile_id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority,
    timeframe: row.timeframe ?? undefined,
    status: parseGoalStatus(row.status),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MarketingGoalsRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByProfileId(profileId: string): Promise<MarketingGoal[]> {
    const { data, error } = await this.supabase
      .from("marketing_goals")
      .select("*")
      .eq("marketing_profile_id", profileId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to list marketing goals: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async create(profileId: string, input: CreateMarketingGoalInput): Promise<MarketingGoal> {
    const { data, error } = await this.supabase
      .from("marketing_goals")
      .insert({
        marketing_profile_id: profileId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? 0,
        timeframe: input.timeframe ?? null,
        status: input.status ?? "active",
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create marketing goal: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateMarketingGoalInput): Promise<MarketingGoal> {
    const payload: Database["public"]["Tables"]["marketing_goals"]["Update"] = {};

    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description ?? null;
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.timeframe !== undefined) payload.timeframe = input.timeframe ?? null;
    if (input.status !== undefined) payload.status = input.status;
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("marketing_goals")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update marketing goal: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("marketing_goals").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete marketing goal: ${error.message}`);
    }
  }

  async findById(id: string): Promise<MarketingGoal | null> {
    const { data, error } = await this.supabase
      .from("marketing_goals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load marketing goal: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }
}
