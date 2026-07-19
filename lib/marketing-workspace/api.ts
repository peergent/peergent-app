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
    throw new Error((data as { error?: string }).error ?? "Request failed.");
  }
  return data;
}

export async function fetchMarketingUnderstanding(
  taskHint?: string
): Promise<{ understanding: MarketingUnderstanding; warnings?: string[] }> {
  const url = taskHint
    ? `/api/marketing-intelligence/understanding?taskHint=${encodeURIComponent(taskHint)}`
    : "/api/marketing-intelligence/understanding";
  const response = await fetch(url);
  return parseJson(response);
}

export async function fetchMarketingProfile(): Promise<{
  profile: MarketingProfileAggregate;
}> {
  const response = await fetch("/api/marketing-intelligence");
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
