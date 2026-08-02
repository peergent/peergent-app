export type CampaignDurationPreset = "2_weeks" | "1_month" | "3_months" | "ongoing";

export const CAMPAIGN_DURATION_PRESETS: readonly {
  id: CampaignDurationPreset;
  labelNl: string;
  labelEn: string;
}[] = [
  { id: "2_weeks", labelNl: "2 weken", labelEn: "2 weeks" },
  { id: "1_month", labelNl: "1 maand", labelEn: "1 month" },
  { id: "3_months", labelNl: "3 maanden", labelEn: "3 months" },
  { id: "ongoing", labelNl: "Doorlopend", labelEn: "Ongoing" },
];

export type CampaignDurationSnapshot = {
  preset: CampaignDurationPreset;
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
  currentDay: number | null;
  remainingDays: number | null;
  progressRatio: number | null;
  isOngoing: boolean;
  isActive: boolean;
};

function toDateOnly(iso: string): Date {
  const datePart = iso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function durationDaysForPreset(preset: CampaignDurationPreset): number | null {
  switch (preset) {
    case "2_weeks":
      return 14;
    case "1_month":
      return 30;
    case "3_months":
      return 90;
    case "ongoing":
      return null;
  }
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function computeEndDateFromPreset(start: Date, preset: CampaignDurationPreset): string | null {
  const days = durationDaysForPreset(preset);
  if (days == null) return null;
  return toIsoDate(addDays(start, days));
}

export function buildDurationAtCreation(
  preset: CampaignDurationPreset,
  start: Date = new Date()
): Pick<CampaignDurationSnapshot, "preset" | "startDate" | "endDate" | "durationDays" | "isOngoing"> {
  const startDate = toIsoDate(start);
  const durationDays = durationDaysForPreset(preset);
  return {
    preset,
    startDate,
    endDate: computeEndDateFromPreset(start, preset),
    durationDays,
    isOngoing: preset === "ongoing",
  };
}

export function inferPresetFromDates(startDate: string, endDate: string): CampaignDurationPreset | null {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (diffDays === 14) return "2_weeks";
  if (diffDays === 30) return "1_month";
  if (diffDays === 90) return "3_months";
  return null;
}

export function resolveCampaignDuration(input: {
  preset?: CampaignDurationPreset | null;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  publishedAt?: string | null;
  now?: Date;
}): CampaignDurationSnapshot | null {
  const preset = input.preset ?? null;
  const plannedStart = input.startDate ?? null;
  const publishedAt = input.publishedAt ?? null;

  if (!preset && !plannedStart && !publishedAt) return null;

  const now = input.now ?? new Date();
  const effectiveStartIso =
    publishedAt != null
      ? toIsoDate(toDateOnly(publishedAt))
      : plannedStart ?? (preset ? toIsoDate(now) : null);

  if (!effectiveStartIso) return null;

  const resolvedPreset =
    preset ??
    (input.endDate && plannedStart ? inferPresetFromDates(plannedStart, input.endDate) : null) ??
    "1_month";

  const durationDays =
    input.durationDays ?? durationDaysForPreset(resolvedPreset);
  const endDate =
    input.endDate ??
    (durationDays != null ? computeEndDateFromPreset(toDateOnly(effectiveStartIso), resolvedPreset) : null);

  const isOngoing = resolvedPreset === "ongoing" || durationDays == null;

  const start = toDateOnly(effectiveStartIso);
  const today = toDateOnly(now.toISOString());
  const elapsedDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);

  if (isOngoing) {
    return {
      preset: resolvedPreset,
      startDate: effectiveStartIso,
      endDate: null,
      durationDays: null,
      currentDay: elapsedDays,
      remainingDays: null,
      progressRatio: null,
      isOngoing: true,
      isActive: publishedAt != null || today >= start,
    };
  }

  const totalDays = durationDays ?? 1;
  const end = endDate ? toDateOnly(endDate) : addDays(start, totalDays - 1);
  const remainingDays = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
  const currentDay = Math.min(totalDays, Math.max(1, elapsedDays));
  const progressRatio = Math.min(1, Math.max(0, (currentDay - 1) / totalDays));

  return {
    preset: resolvedPreset,
    startDate: effectiveStartIso,
    endDate: toIsoDate(end),
    durationDays: totalDays,
    currentDay,
    remainingDays,
    progressRatio,
    isOngoing: false,
    isActive: publishedAt != null || today >= start,
  };
}

export function formatShortDate(iso: string, locale?: string | null): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function formatDurationRange(
  duration: CampaignDurationSnapshot,
  locale?: string | null
): string {
  const start = formatShortDate(duration.startDate, locale);
  if (!duration.endDate) return start;
  return `${start} → ${formatShortDate(duration.endDate, locale)}`;
}

export function formatRunningStatus(duration: CampaignDurationSnapshot, locale?: string | null): string {
  const nl = locale === "nl";
  if (duration.isOngoing) {
    return nl
      ? `Doorlopend · Dag ${duration.currentDay ?? 1}`
      : `Ongoing · Day ${duration.currentDay ?? 1}`;
  }
  return nl
    ? `Dag ${duration.currentDay ?? 1} van ${duration.durationDays ?? "—"} · ${duration.remainingDays ?? 0} dagen resterend`
    : `Day ${duration.currentDay ?? 1} of ${duration.durationDays ?? "—"} · ${duration.remainingDays ?? 0} days remaining`;
}

export function formatDurationPresetLabel(preset: CampaignDurationPreset, locale?: string | null): string {
  const entry = CAMPAIGN_DURATION_PRESETS.find((p) => p.id === preset);
  if (!entry) return preset;
  return locale === "nl" ? entry.labelNl : entry.labelEn;
}

export function campaignResultsHref(peerId: string, projectId: string): string {
  return `/office/${peerId}/work/campaigns/${projectId}?view=results`;
}
