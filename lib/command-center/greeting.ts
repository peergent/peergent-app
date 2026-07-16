import type { GreetingData } from "./types";

type GreetingOptions = {
  firstName?: string;
  workspaceName?: string;
};

function getSalutation(date: Date) {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getGreeting(options: GreetingOptions = {}): GreetingData {
  const now = new Date();

  return {
    salutation: getSalutation(now),
    name: options.firstName ?? "Djemo",
    subtitle: "Here is your briefing.",
    workspaceName: options.workspaceName ?? "Your workspace",
    formattedDate: formatDisplayDate(now),
  };
}
