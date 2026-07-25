export const HQ_TIME_ZONE = "Europe/Amsterdam";

export type HqInitialTemporal = {
  initialDateTime: string;
  initialDateLabel: string;
  initialGreeting: string;
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function hourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).formatToParts(date);

  const hourPart = parts.find((part) => part.type === "hour");
  return hourPart ? Number(hourPart.value) : date.getHours();
}

export function buildHqInitialTemporal(
  now: Date = new Date(),
  timeZone: string = HQ_TIME_ZONE
): HqInitialTemporal {
  return {
    initialDateTime: now.toISOString(),
    initialDateLabel: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    }).format(now),
    initialGreeting: greetingForHour(hourInTimeZone(now, timeZone)),
  };
}

/** @deprecated Use HqInitialTemporal from buildHqInitialTemporal */
export type HqTemporalLabels = {
  eyebrowDateTime: string;
  eyebrow: string;
  greetingTime: string;
};

export function formatHqTemporalLabels(
  now: Date,
  timeZone: string = HQ_TIME_ZONE
): HqTemporalLabels {
  const initial = buildHqInitialTemporal(now, timeZone);
  const dateOnly = initial.initialDateTime.slice(0, 10);

  return {
    eyebrowDateTime: dateOnly,
    eyebrow: `AI WORKFORCE — ${initial.initialDateLabel.toUpperCase()}`,
    greetingTime: initial.initialGreeting,
  };
}
