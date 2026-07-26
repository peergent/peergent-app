import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingProfileAggregate,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    const message = (data as { error?: string }).error ?? "Request failed.";
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function fetchMarketingUnderstanding(
  taskHint?: string
): Promise<{ understanding: MarketingUnderstanding; warnings?: string[] }> {
  const url = taskHint
    ? `/api/marketing-intelligence/understanding?taskHint=${encodeURIComponent(taskHint)}`
    : "/api/marketing-intelligence/understanding";
  const response = await fetch(url, { cache: "no-store" });
  return parseJson(response);
}

export async function fetchMarketingProfile(): Promise<{
  profile: MarketingProfileAggregate;
}> {
  const response = await fetch("/api/marketing-intelligence", { cache: "no-store" });
  return parseJson(response);
}

export async function generateMarketingStrategy(
  peerId: string,
  taskHint?: string
): Promise<{ strategy: MarketingStrategy; warnings: string[]; traceId: string }> {
  const response = await fetch("/api/marketing-intelligence/strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId, taskHint }),
  });
  return parseJson(response);
}

export async function generateMarketingCreativeBrief(
  peerId: string,
  strategy: MarketingStrategy,
  campaignProject: { id: string; title: string; goal: string },
  taskHint?: string
): Promise<{ brief: import("@/lib/creative-brief").CreativeBrief; warnings: string[]; traceId: string }> {
  const response = await fetch("/api/marketing-intelligence/strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      peerId,
      taskHint,
      artifact: "creative_brief",
      strategy,
      campaignProject,
    }),
  });
  return parseJson(response);
}

export async function generateMarketingLinkedInPost(
  peerId: string,
  strategy: MarketingStrategy,
  creativeBrief: import("@/lib/creative-brief").CreativeBrief,
  campaignProject: { id: string; title: string; goal: string },
  workUnitId: string,
  taskHint?: string
): Promise<{
  post: import("@/lib/marketing-intelligence/linkedin-post-generation").MarketingLinkedInPost;
  warnings: string[];
  traceId: string;
}> {
  const response = await fetch("/api/marketing-intelligence/strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      peerId,
      taskHint,
      artifact: "linkedin_post",
      strategy,
      creativeBrief,
      campaignProject,
      workUnitId,
    }),
  });
  return parseJson(response);
}

export async function generateMarketingEmailCampaign(
  peerId: string,
  strategy: MarketingStrategy,
  creativeBrief: import("@/lib/creative-brief").CreativeBrief,
  campaignProject: { id: string; title: string; goal: string },
  workUnitId: string,
  taskHint?: string
): Promise<{
  email: import("@/lib/marketing-intelligence/email-generation").MarketingEmailCampaign;
  warnings: string[];
  traceId: string;
}> {
  const response = await fetch("/api/marketing-intelligence/strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      peerId,
      taskHint,
      artifact: "email_campaign",
      strategy,
      creativeBrief,
      campaignProject,
      workUnitId,
    }),
  });
  return parseJson(response);
}

export async function generateMarketingPlan(
  peerId: string,
  strategy: MarketingStrategy,
  taskHint?: string
): Promise<{ plan: MarketingPlan; warnings: string[]; traceId: string }> {
  const response = await fetch("/api/marketing-intelligence/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId, strategy, taskHint }),
  });
  return parseJson(response);
}

export async function generateContentDraft(
  peerId: string,
  plan: MarketingPlan,
  planActivityReference: string,
  taskHint?: string
): Promise<{ draft: MarketingContentDraft; warnings: string[]; traceId: string }> {
  const response = await fetch("/api/marketing-intelligence/content-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ peerId, plan, planActivityReference, taskHint }),
  });
  return parseJson(response);
}

export async function markDraftStatus(
  peerId: string,
  draftId: string,
  status: MarketingContentDraft["status"]
): Promise<void> {
  void peerId;
  void draftId;
  void status;
  // Client-side only until persistence API exists — handled in workspace state
}
