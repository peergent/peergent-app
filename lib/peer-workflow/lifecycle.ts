import type {
  ActivityLifecycleState,
  DeriveActivityLifecycleInput,
  WorkflowActivityRef,
} from "./types";

/** Maps artifact + publication state to a canonical activity lifecycle (peer-agnostic). */
export function deriveActivityLifecycle(
  input: DeriveActivityLifecycleInput
): ActivityLifecycleState {
  if (input.isDrafting) {
    return "drafting";
  }

  const artifact = input.artifact;
  if (!artifact) {
    return "not_started";
  }

  const status = artifact.status;

  if (status === "draft" || status === "ready_for_review") {
    return "waiting_for_review";
  }

  if (status === "rejected") {
    return "not_started";
  }

  if (status === "published" || input.publication?.status === "published") {
    return "published";
  }

  if (status === "ready_to_publish" || input.publication?.status === "ready") {
    return "ready_to_publish";
  }

  if (status === "approved") {
    return "approved";
  }

  return "not_started";
}

/** Sort activities by scheduled order (e.g. plan week). */
export function sortActivitiesBySchedule<T extends WorkflowActivityRef>(
  activities: T[]
): T[] {
  return [...activities].sort(
    (a, b) => (a.scheduledOrder ?? Number.MAX_SAFE_INTEGER) - (b.scheduledOrder ?? Number.MAX_SAFE_INTEGER)
  );
}

/** First activity that has not reached published/completed. */
export function findNextScheduledActivity<T extends WorkflowActivityRef>(
  activities: T[],
  lifecycleByTitle: Map<string, ActivityLifecycleState>
): T | undefined {
  const sorted = sortActivitiesBySchedule(activities);
  return sorted.find((activity) => {
    const state = lifecycleByTitle.get(activity.title.trim().toLowerCase());
    return (
      !state ||
      state === "not_started" ||
      state === "drafting" ||
      state === "waiting_for_review" ||
      state === "approved" ||
      state === "ready_to_publish"
    );
  });
}
