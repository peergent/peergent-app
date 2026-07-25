/** Spoken week labels for contextual Studio invitations. */
const WEEK_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
] as const;

export function formatCampaignWeekPhrase(week?: number): string {
  if (week == null) return "";
  const word = WEEK_WORDS[week - 1] ?? String(week);
  return `week-${word} `;
}

export function formatWriteNextActionLabel(title: string, scheduledWeek?: number): string {
  const week = formatCampaignWeekPhrase(scheduledWeek);
  return `Next up: write the ${week}${title.toLowerCase()}`;
}
