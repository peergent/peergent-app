import type { HomeNeedsYouItem } from "@/lib/home/types";

export type InboxItemKind =
  | "draft_review"
  | "ready_to_publish"
  | "draft_approved"
  | "knowledge_incomplete"
  | "ready_for_strategy"
  | "strategy_complete";

export type InboxItem = HomeNeedsYouItem & {
  kind: InboxItemKind;
};

export type InboxViewModel = {
  items: InboxItem[];
  isEmpty: boolean;
  urgentCount: number;
};

export type BuildInboxViewModelInput = {
  marketingSnapshots: import("@/lib/home/types").HomePeerWorkspaceSnapshot[];
  understanding: import("@/lib/marketing-intelligence").MarketingUnderstanding | null;
  locale?: import("@/lib/i18n").HomeLocale;
};
