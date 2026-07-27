import type {
  CampaignComparisonSection,
  CampaignComparisonViewModel,
} from "./campaign-collaboration-types";
import type { ComparableSection } from "./extract-comparable-sections";
import { normalizeSectionValue } from "./extract-comparable-sections";

function sectionChange(
  oldValue: string | null,
  newValue: string | null
): CampaignComparisonSection["change"] {
  const oldNorm = oldValue ? normalizeSectionValue(oldValue) : "";
  const newNorm = newValue ? normalizeSectionValue(newValue) : "";
  if (!oldNorm && newNorm) return "added";
  if (oldNorm && !newNorm) return "removed";
  if (oldNorm === newNorm) return "unchanged";
  return "changed";
}

export function compareArtifactSections(input: {
  workUnitId: string;
  fromVersion: number;
  toVersion: number;
  oldSections: readonly ComparableSection[];
  newSections: readonly ComparableSection[];
  priorContentAvailable: boolean;
}): CampaignComparisonViewModel {
  const newById = new Map(input.newSections.map((s) => [s.id, s]));
  const oldById = new Map(input.oldSections.map((s) => [s.id, s]));
  const ids = [...new Set([...newById.keys(), ...oldById.keys()])];

  const sections: CampaignComparisonSection[] = ids.map((id) => {
    const oldSec = oldById.get(id);
    const newSec = newById.get(id);
    const oldValue = oldSec?.value ?? null;
    const newValue = newSec?.value ?? null;
    return {
      id,
      label: newSec?.label ?? oldSec?.label ?? id,
      change: sectionChange(oldValue, newValue),
      oldValue,
      newValue,
    };
  });

  const changed = sections.filter((s) => s.change !== "unchanged").length;
  const summary = input.priorContentAvailable
    ? changed === 0
      ? "No section changes detected between these versions."
      : `${changed} section${changed === 1 ? "" : "s"} updated between version ${input.fromVersion} and ${input.toVersion}.`
    : `Version ${input.fromVersion} content is not stored in the workspace. Showing version ${input.toVersion} against revision feedback.`;

  return {
    workUnitId: input.workUnitId,
    fromVersion: input.fromVersion,
    toVersion: input.toVersion,
    sections,
    summary,
    priorContentAvailable: input.priorContentAvailable,
  };
}

export function buildRevisionSummaryBullets(
  comparison: CampaignComparisonViewModel
): readonly string[] {
  const bullets: string[] = [];
  for (const section of comparison.sections) {
    if (section.change === "unchanged") continue;
    if (section.change === "added") {
      bullets.push(`Added ${section.label.toLowerCase()}`);
      continue;
    }
    if (section.change === "removed") {
      bullets.push(`Removed ${section.label.toLowerCase()}`);
      continue;
    }
    bullets.push(`Updated ${section.label.toLowerCase()}`);
  }
  return bullets.slice(0, 8);
}
