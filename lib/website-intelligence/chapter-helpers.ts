import type { AssessmentFinding, ChapterConfidence } from "./types";

const MAX_BULLET_LENGTH = 110;

export function truncateStatement(text: string, max = MAX_BULLET_LENGTH): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function bulletsFromFindings(
  findings: AssessmentFinding[],
  max = 3
): string[] {
  return findings.slice(0, max).map((f) => truncateStatement(f.statement));
}

export function bulletsFromStrings(items: string[], max = 3): string[] {
  return items.slice(0, max).map((item) => truncateStatement(item));
}

export function flattenOperationFindings(
  areas: { findings: AssessmentFinding[] }[],
  max = 3
): string[] {
  const merged = areas.flatMap((area) => area.findings);
  return bulletsFromFindings(merged, max);
}

export function mergeFindings(
  ...groups: AssessmentFinding[][]
): AssessmentFinding[] {
  return groups.flat();
}

export function confidenceLine(confidence: ChapterConfidence): string {
  const level = confidence.level.charAt(0).toUpperCase() + confidence.level.slice(1);
  return `${level} — ${confidence.reason}`;
}
