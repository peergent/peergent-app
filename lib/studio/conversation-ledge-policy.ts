import type { ConversationMessage } from "@/lib/marketing-workspace/experience";

/**
 * Conversation Ledge policy — the table always wins.
 * The ledge redirects Maya; it is never a second workspace.
 */
export const CONVERSATION_LEDGE_POLICY = {
  maxVisibleMessages: 5,
  maxExpandedHeightVh: 28,
  maxWidthPx: 320,
  /** No backdrop dimming — work plane stays fully visible and primary. */
  useBackdrop: false,
  /** Ledge collapses after redirect so attention returns to the table. */
  closeOnRedirect: true,
} as const;

export function capConversationMessages(
  messages: ConversationMessage[],
  limit = CONVERSATION_LEDGE_POLICY.maxVisibleMessages
): ConversationMessage[] {
  if (messages.length <= limit) return messages;
  return messages.slice(messages.length - limit);
}
