import type {
  MarketingContentDraft,
  MarketingPlan,
} from "@/lib/marketing-intelligence";
import { isDraftablePlanActivity } from "@/lib/marketing-intelligence";
import {
  ACTIVITY_LIFECYCLE_LABELS,
  deriveActivityLifecycle,
  sortActivitiesBySchedule,
  type ActivityLifecycleState,
  type PublicationPackage,
} from "@/lib/peer-workflow";

export { ACTIVITY_LIFECYCLE_LABELS };

export type MarketingActivityLifecycleContext = {
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  publicationPackages: PublicationPackage[];
  generatingActivity?: string | null;
  generating?: boolean;
};

function activityKey(title: string): string {
  return title.trim().toLowerCase();
}

export function buildMarketingActivityLifecycleMap(
  input: MarketingActivityLifecycleContext
): Map<string, ActivityLifecycleState> {
  const map = new Map<string, ActivityLifecycleState>();
  if (!input.plan) return map;

  for (const entry of input.plan.contentCalendar) {
    if (!isDraftablePlanActivity(entry)) continue;

    const key = activityKey(entry.title);
    const draft = input.drafts.find(
      (item) => activityKey(item.planActivityReference) === key
    );
    const publication = input.publicationPackages.find(
      (item) => activityKey(item.activityReference) === key
    );
    const isDrafting =
      Boolean(input.generating) &&
      activityKey(input.generatingActivity ?? "") === key;

    map.set(
      key,
      deriveActivityLifecycle({
        activity: {
          id: key,
          title: entry.title,
          scheduledOrder: entry.scheduledWeek,
        },
        artifact: draft
          ? {
              id: draft.id,
              activityReference: draft.planActivityReference,
              status: draft.status,
              title: draft.title,
            }
          : undefined,
        publication: publication
          ? {
              activityReference: publication.activityReference,
              status: publication.status,
            }
          : undefined,
        isDrafting,
      })
    );
  }

  if (isPlanExecutionComplete(input.plan, map)) {
    for (const [key, state] of map.entries()) {
      if (state === "published") {
        map.set(key, "completed");
      }
    }
  }

  return map;
}

export function getActivityLifecycleForTitle(
  title: string,
  lifecycleMap: Map<string, ActivityLifecycleState>
): ActivityLifecycleState {
  return lifecycleMap.get(activityKey(title)) ?? "not_started";
}

export function findNextMarketingPlanActivity(
  plan: MarketingPlan | null,
  lifecycleMap: Map<string, ActivityLifecycleState>,
  options?: { states?: ActivityLifecycleState[] }
) {
  if (!plan) return undefined;

  const states = options?.states ?? ["not_started"];

  const activities = plan.contentCalendar
    .filter(isDraftablePlanActivity)
    .map((entry) => ({
      id: activityKey(entry.title),
      title: entry.title,
      scheduledOrder: entry.scheduledWeek,
    }))
    .filter((activity) =>
      states.includes(lifecycleMap.get(activityKey(activity.title)) ?? "not_started")
    );

  return sortActivitiesBySchedule(activities)[0];
}

export function countActivitiesInLifecycle(
  lifecycleMap: Map<string, ActivityLifecycleState>,
  states: ActivityLifecycleState[]
): number {
  let count = 0;
  for (const state of lifecycleMap.values()) {
    if (states.includes(state)) count += 1;
  }
  return count;
}

export function isPlanExecutionComplete(
  plan: MarketingPlan | null,
  lifecycleMap: Map<string, ActivityLifecycleState>
): boolean {
  if (!plan) return false;
  const draftable = plan.contentCalendar.filter(isDraftablePlanActivity);
  if (draftable.length === 0) return false;
  return draftable.every((entry) => {
    const state = getActivityLifecycleForTitle(entry.title, lifecycleMap);
    return state === "published" || state === "completed";
  });
}
