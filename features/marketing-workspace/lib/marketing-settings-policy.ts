import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";

export type WorkspaceAutonomyMode = "always_ask" | "strategic_only" | "fully_autonomous";

const POSTING_CATEGORIES = new Set([
  "instagram",
  "linkedin",
  "content_marketing",
  "blog",
]);

const BUDGET_CATEGORIES = new Set(["google_ads", "meta_ads"]);

const WEBSITE_CATEGORIES = new Set(["website", "blog", "seo"]);

const EMAIL_CATEGORIES = new Set(["newsletter"]);

export function deriveWorkspaceAutonomyMode(
  responsibilities: MarketingResponsibility[]
): WorkspaceAutonomyMode {
  const enabled = responsibilities.filter((r) => r.enabled);
  if (enabled.length === 0) return "strategic_only";

  const levels = enabled.map((r) => r.autonomyLevel);
  if (levels.every((l) => l === "manual" || l === "suggest")) return "always_ask";
  if (levels.every((l) => l === "autonomous" || l === "full")) return "fully_autonomous";
  return "strategic_only";
}

export function applyWorkspaceAutonomyMode(
  responsibilities: MarketingResponsibility[],
  mode: WorkspaceAutonomyMode
): MarketingResponsibility[] {
  const levelForMode =
    mode === "always_ask"
      ? "suggest"
      : mode === "fully_autonomous"
        ? "autonomous"
        : "semi_autonomous";

  const now = new Date().toISOString();
  return responsibilities.map((r) => {
    if (!r.enabled) return r;
    return {
      ...r,
      autonomyLevel: levelForMode,
      approvalPolicy:
        mode === "fully_autonomous" && !r.guardrails.approvalRequired
          ? "fully_automatic"
          : r.approvalPolicy,
      updatedAt: now,
    };
  });
}

export function deriveRoutinePostingAutonomous(
  responsibilities: MarketingResponsibility[]
): boolean {
  const posting = responsibilities.filter((r) => r.enabled && POSTING_CATEGORIES.has(r.category));
  if (posting.length === 0) return false;
  return posting.every(
    (r) =>
      r.approvalPolicy === "fully_automatic" ||
      (r.approvalPolicy !== "approval_required" && r.guardrails.approvalRequired !== true)
  );
}

export function applyRoutinePostingAutonomous(
  responsibilities: MarketingResponsibility[],
  autonomous: boolean
): MarketingResponsibility[] {
  const now = new Date().toISOString();
  return responsibilities.map((r) => {
    if (!r.enabled || !POSTING_CATEGORIES.has(r.category)) return r;
    return {
      ...r,
      approvalPolicy: autonomous ? "fully_automatic" : "approval_required",
      guardrails: {
        ...r.guardrails,
        approvalRequired: !autonomous,
      },
      updatedAt: now,
    };
  });
}

export function deriveBudgetAutonomyLimit(
  responsibilities: MarketingResponsibility[]
): number | null {
  const budget = responsibilities.filter((r) => r.enabled && BUDGET_CATEGORIES.has(r.category));
  const limits = budget
    .map((r) => r.guardrails.maxMonthlySpend)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (limits.length === 0) return null;
  return Math.min(...limits);
}

export function applyBudgetAutonomyLimit(
  responsibilities: MarketingResponsibility[],
  limit: number
): MarketingResponsibility[] {
  const now = new Date().toISOString();
  return responsibilities.map((r) => {
    if (!r.enabled || !BUDGET_CATEGORIES.has(r.category)) return r;
    return {
      ...r,
      guardrails: { ...r.guardrails, maxMonthlySpend: limit },
      updatedAt: now,
    };
  });
}

export function deriveWebsiteBlogAutonomous(
  responsibilities: MarketingResponsibility[]
): boolean {
  const web = responsibilities.filter((r) => r.enabled && WEBSITE_CATEGORIES.has(r.category));
  if (web.length === 0) return false;
  return web.some((r) => r.approvalPolicy === "fully_automatic");
}

export function applyWebsiteBlogAutonomous(
  responsibilities: MarketingResponsibility[],
  blogAuto: boolean
): MarketingResponsibility[] {
  const now = new Date().toISOString();
  return responsibilities.map((r) => {
    if (!r.enabled || !WEBSITE_CATEGORIES.has(r.category)) return r;
    const isBlog = r.category === "blog";
    if (isBlog) {
      return {
        ...r,
        approvalPolicy: blogAuto ? "fully_automatic" : "approval_required",
        guardrails: { ...r.guardrails, approvalRequired: !blogAuto },
        updatedAt: now,
      };
    }
    return {
      ...r,
      approvalPolicy: "approval_required",
      guardrails: { ...r.guardrails, approvalRequired: true },
      updatedAt: now,
    };
  });
}

export function deriveEmailRoutineAutonomous(
  responsibilities: MarketingResponsibility[]
): boolean {
  const email = responsibilities.find((r) => r.enabled && EMAIL_CATEGORIES.has(r.category));
  if (!email) return false;
  return email.approvalPolicy === "fully_automatic";
}

export function applyEmailRoutineAutonomous(
  responsibilities: MarketingResponsibility[],
  autonomous: boolean
): MarketingResponsibility[] {
  const now = new Date().toISOString();
  return responsibilities.map((r) => {
    if (!r.enabled || !EMAIL_CATEGORIES.has(r.category)) return r;
    return {
      ...r,
      approvalPolicy: autonomous ? "fully_automatic" : "approval_required",
      guardrails: { ...r.guardrails, approvalRequired: !autonomous },
      updatedAt: now,
    };
  });
}

/** Safe internal pilot: always ask + no autonomous external side effects. */
export function applyPilotSafeAutonomy(
  responsibilities: MarketingResponsibility[]
): MarketingResponsibility[] {
  let next = applyWorkspaceAutonomyMode(responsibilities, "always_ask");
  next = applyRoutinePostingAutonomous(next, false);
  next = applyWebsiteBlogAutonomous(next, false);
  next = applyEmailRoutineAutonomous(next, false);
  next = applyBudgetAutonomyLimit(next, 0);
  return next.map((r) =>
    r.enabled
      ? {
          ...r,
          approvalPolicy: "approval_required",
          guardrails: { ...r.guardrails, approvalRequired: true },
        }
      : r
  );
}

export const PILOT_AUTONOMY_MODE: WorkspaceAutonomyMode = "always_ask";
