import type { HomeLocale } from "./home-copy";

export type InboxCopy = {
  pageTitle: string;
  pageDescription: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  errorTitle: string;
  errorRetry: string;
  loadingLabel: string;
  itemCount: (count: number) => string;
};

const en: InboxCopy = {
  pageTitle: "Inbox",
  pageDescription: "Work that needs your judgment.",
  emptyTitle: "All caught up",
  emptyBody: "Nothing needs you right now. Your team is moving forward.",
  emptyCta: "Go to Home",
  errorTitle: "Couldn't load your inbox",
  errorRetry: "Try again",
  loadingLabel: "Loading inbox…",
  itemCount: (count) =>
    count === 1 ? "1 item needs you" : `${count} items need you`,
};

const nl: InboxCopy = {
  pageTitle: "Inbox",
  pageDescription: "Werk dat je oordeel nodig heeft.",
  emptyTitle: "Alles bijgewerkt",
  emptyBody: "Er is nu niets dat je nodig hebt. Je team gaat door.",
  emptyCta: "Naar Home",
  errorTitle: "Inbox laden mislukt",
  errorRetry: "Opnieuw proberen",
  loadingLabel: "Inbox laden…",
  itemCount: (count) =>
    count === 1 ? "1 item heeft je nodig" : `${count} items hebben je nodig`,
};

export function getInboxCopy(locale: HomeLocale = "en"): InboxCopy {
  return locale === "nl" ? nl : en;
}
