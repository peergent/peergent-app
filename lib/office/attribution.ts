import { findProjectForDraft } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";

/**
 * Resolves which engagement a piece of content belongs to.
 *
 * Uses the canonical `findProjectForDraft` first. When a unit has not recorded
 * a `draftId` — which happens when content is produced ahead of the unit being
 * linked — it falls back to the plan activity reference both sides already
 * carry. Without the fallback those items silently vanish from campaign cuts.
 *
 * Never matches on title: two campaigns may share one.
 */
export function resolveProjectIdForDraft(
  draft: Pick<MarketingContentDraft, "id" | "planActivityReference">,
  workUnits: readonly WorkUnit[]
): string | null {
  const direct = findProjectForDraft(draft.id, workUnits as WorkUnit[]);
  if (direct) return direct;

  const reference = draft.planActivityReference?.trim();
  if (!reference) return null;

  const viaReference = workUnits.find(
    (unit) => unit.planActivityReference === reference && unit.projectId
  );
  return viaReference?.projectId ?? null;
}
