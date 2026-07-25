import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import {
  MarketingContentRepository,
  MarketingGoalsRepository,
  MarketingProfileRepository,
} from "../repositories";
import type {
  CreateMarketingContentInput,
  CreateMarketingGoalInput,
  MarketingContentItem,
  MarketingGoal,
  MarketingProfile,
  MarketingProfileAggregate,
  UpdateMarketingContentInput,
  UpdateMarketingGoalInput,
  UpdateMarketingProfileInput,
} from "../types";

export class MarketingProfileNotFoundError extends Error {
  constructor(message = "Marketing profile not found for this organization.") {
    super(message);
    this.name = "MarketingProfileNotFoundError";
  }
}

export class MarketingEntityNotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} not found.`);
    this.name = "MarketingEntityNotFoundError";
  }
}

export class MarketingIntelligenceService {
  private readonly profileRepo: MarketingProfileRepository;
  private readonly goalsRepo: MarketingGoalsRepository;
  private readonly contentRepo: MarketingContentRepository;

  constructor(supabase: AppSupabaseClient) {
    this.profileRepo = new MarketingProfileRepository(supabase);
    this.goalsRepo = new MarketingGoalsRepository(supabase);
    this.contentRepo = new MarketingContentRepository(supabase);
  }

  async getOrCreateProfile(organizationId: string): Promise<MarketingProfile> {
    const existing = await this.profileRepo.findByOrganizationId(organizationId);
    return existing ?? this.profileRepo.create(organizationId);
  }

  async getAggregate(organizationId: string): Promise<MarketingProfileAggregate> {
    const profile = await this.getOrCreateProfile(organizationId);
    const [goals, contentItems] = await Promise.all([
      this.goalsRepo.listByProfileId(profile.id),
      this.contentRepo.listByProfileId(profile.id),
    ]);

    return { ...profile, goals, contentItems };
  }

  async updateProfile(
    organizationId: string,
    input: UpdateMarketingProfileInput
  ): Promise<MarketingProfileAggregate> {
    const profile = await this.getOrCreateProfile(organizationId);
    await this.profileRepo.update(profile.id, input);
    return this.getAggregate(organizationId);
  }

  async listGoals(organizationId: string): Promise<MarketingGoal[]> {
    const profile = await this.getOrCreateProfile(organizationId);
    return this.goalsRepo.listByProfileId(profile.id);
  }

  async createGoal(
    organizationId: string,
    input: CreateMarketingGoalInput
  ): Promise<MarketingGoal> {
    const profile = await this.getOrCreateProfile(organizationId);
    return this.goalsRepo.create(profile.id, input);
  }

  async updateGoal(
    organizationId: string,
    goalId: string,
    input: UpdateMarketingGoalInput
  ): Promise<MarketingGoal> {
    const profile = await this.getOrCreateProfile(organizationId);
    const goal = await this.goalsRepo.findById(goalId);
    if (!goal || goal.marketingProfileId !== profile.id) {
      throw new MarketingEntityNotFoundError("Marketing goal");
    }
    return this.goalsRepo.update(goalId, input);
  }

  async deleteGoal(organizationId: string, goalId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(organizationId);
    const goal = await this.goalsRepo.findById(goalId);
    if (!goal || goal.marketingProfileId !== profile.id) {
      throw new MarketingEntityNotFoundError("Marketing goal");
    }
    await this.goalsRepo.delete(goalId);
  }

  async listContent(organizationId: string): Promise<MarketingContentItem[]> {
    const profile = await this.getOrCreateProfile(organizationId);
    return this.contentRepo.listByProfileId(profile.id);
  }

  async createContent(
    organizationId: string,
    input: CreateMarketingContentInput
  ): Promise<MarketingContentItem> {
    const profile = await this.getOrCreateProfile(organizationId);
    return this.contentRepo.create(profile.id, input);
  }

  async updateContent(
    organizationId: string,
    contentId: string,
    input: UpdateMarketingContentInput
  ): Promise<MarketingContentItem> {
    const profile = await this.getOrCreateProfile(organizationId);
    const item = await this.contentRepo.findById(contentId);
    if (!item || item.marketingProfileId !== profile.id) {
      throw new MarketingEntityNotFoundError("Marketing content item");
    }
    return this.contentRepo.update(contentId, input);
  }

  async deleteContent(organizationId: string, contentId: string): Promise<void> {
    const profile = await this.getOrCreateProfile(organizationId);
    const item = await this.contentRepo.findById(contentId);
    if (!item || item.marketingProfileId !== profile.id) {
      throw new MarketingEntityNotFoundError("Marketing content item");
    }
    await this.contentRepo.delete(contentId);
  }
}

export function createMarketingIntelligenceService(
  supabase: AppSupabaseClient
): MarketingIntelligenceService {
  return new MarketingIntelligenceService(supabase);
}
