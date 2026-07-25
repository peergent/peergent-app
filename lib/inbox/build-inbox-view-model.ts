import { buildAttentionItems } from "./build-attention-items";
import type { BuildInboxViewModelInput, InboxViewModel } from "./types";

export function buildInboxViewModel(input: BuildInboxViewModelInput): InboxViewModel {
  const items = buildAttentionItems(input);

  return {
    items,
    isEmpty: items.length === 0,
    urgentCount: items.filter((item) => item.priority === "urgent").length,
  };
}
