import { isDraftablePlanActivity } from "@/lib/marketing-intelligence";
import type { MarketingPlan } from "@/lib/marketing-intelligence";
import type { DelegationChannel, DelegationTask } from "./parse-delegation-intent";

function channelMatchesActivity(
  channel: DelegationChannel,
  activity: MarketingPlan["contentCalendar"][number]
): boolean {
  const type = activity.contentType.toLowerCase();
  const title = activity.title.toLowerCase();
  switch (channel) {
    case "instagram":
      return (
        type === "social_media_post" ||
        title.includes("instagram") ||
        title.includes("ig ")
      );
    case "linkedin":
      return type === "linkedin_post" || title.includes("linkedin");
    case "newsletter":
      return type === "newsletter" || title.includes("newsletter");
    case "blog":
      return type === "blog_article" || title.includes("blog");
    case "meta_ads":
      return type === "meta_ads_copy" || title.includes("meta");
    case "google_ads":
      return type === "google_ads_copy" || title.includes("google ad");
    case "email":
      return title.includes("email") || title.includes("mail");
    default:
      return false;
  }
}

export function findPlanActivityForDelegation(
  plan: MarketingPlan,
  channel: DelegationChannel
): string | null {
  const draftable = plan.contentCalendar.filter(isDraftablePlanActivity);
  const matched = draftable.find((activity) => channelMatchesActivity(channel, activity));
  if (matched) return matched.title;
  return draftable[0]?.title ?? null;
}

export function buildDelegationActivityTitle(task: DelegationTask): string {
  const base = task.topic.slice(0, 60);
  switch (task.channel) {
    case "instagram":
      return base ? `Instagram: ${base}` : "Instagram post";
    case "linkedin":
      return base ? `LinkedIn: ${base}` : "LinkedIn post";
    default:
      return base || "Delegated content";
  }
}
