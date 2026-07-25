import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import {
  mapDraftStatusToLifecycleStage,
  mapGeneratingToLifecycleStage,
  syncWorkUnitFromMarketingState,
} from "@/lib/peer-workflow/work-unit-engine";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

type HookGenerating =
  | "understanding"
  | "strategy"
  | "plan"
  | "draft"
  | "publication"
  | null;

function mapHookGeneratingToFocus(generating: HookGenerating): GeneratingActivity | null {
  if (!generating) return null;
  if (generating === "strategy") return "strategy";
  if (generating === "plan") return "plan";
  if (generating === "draft") return "draft";
  if (generating === "publication") return "publication";
  return "understanding";
}

export function syncWorkUnitsWithMarketingState(input: {
  workUnits: WorkUnit[];
  activeWorkUnitId: string | null;
  generating: HookGenerating;
  generatingActivity: string | null;
  drafts: MarketingContentDraft[];
}): WorkUnit[] {
  const focus = mapHookGeneratingToFocus(input.generating);

  return input.workUnits.map((unit) => {
    const isActiveUnit =
      unit.id === input.activeWorkUnitId ||
      (input.activeWorkUnitId === null &&
        !unit.cancelled &&
        unit.draftId === null &&
        input.workUnits.filter((u) => !u.cancelled && !u.draftId).length === 1 &&
        input.workUnits.find((u) => !u.cancelled && !u.draftId)?.id === unit.id);

    const draft = unit.draftId
      ? (input.drafts.find((d) => d.id === unit.draftId) ?? null)
      : input.drafts.find(
          (d) =>
            unit.planActivityReference &&
            d.planActivityReference.trim().toLowerCase() ===
              unit.planActivityReference.trim().toLowerCase()
        ) ?? null;

    const generatingForUnit =
      isActiveUnit && focus
        ? focus
        : null;

    let synced = syncWorkUnitFromMarketingState({
      unit,
      generating: generatingForUnit,
      draft,
    });

    if (draft && !synced.draftId) {
      synced = { ...synced, draftId: draft.id };
    }

    const targetFromDraft = draft ? mapDraftStatusToLifecycleStage(draft.status) : null;
    if (
      draft &&
      targetFromDraft &&
      !generatingForUnit &&
      synced.status !== targetFromDraft &&
      !synced.paused &&
      !synced.cancelled
    ) {
      synced = syncWorkUnitFromMarketingState({
        unit: synced,
        generating: null,
        draft,
      });
    }

    return synced;
  });
}

export function resolveActiveWorkUnitId(
  workUnits: WorkUnit[],
  explicitId: string | null
): string | null {
  if (explicitId) return explicitId;
  const active = workUnits.find(
    (u) =>
      !u.cancelled &&
      u.status !== "published" &&
      u.status !== "monitoring" &&
      u.status !== "optimizing"
  );
  return active?.id ?? null;
}

export function estimateCompletionMinutes(stage: ReturnType<typeof mapGeneratingToLifecycleStage>): number {
  switch (stage) {
    case "understanding":
      return 2;
    case "planning":
      return 5;
    case "creating":
      return 12;
    case "review_ready":
      return 0;
    default:
      return 8;
  }
}
