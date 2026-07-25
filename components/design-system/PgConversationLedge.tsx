"use client";

import { FormEvent, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import PgButton from "@/components/design-system/PgButton";
import {
  capConversationMessages,
  CONVERSATION_LEDGE_POLICY,
} from "@/lib/studio/conversation-ledge-policy";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";
import type {
  ConversationMessage,
  ConversationNextStep,
} from "@/lib/marketing-workspace/experience";
import { cn } from "@/lib/ui/cn";

export type PgConversationLedgeProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peerName: string;
  messages: ConversationMessage[];
  pendingNextStep?: ConversationNextStep | null;
  onSend: (message: string) => void;
  onRedirect?: (step: ConversationNextStep) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Conversation ledge — side channel to redirect Maya.
 * Never a second workspace: no backdrop, capped history, table stays dominant.
 */
export default function PgConversationLedge({
  open,
  onOpenChange,
  peerName,
  messages,
  pendingNextStep,
  onSend,
  onRedirect,
  disabled = false,
  className,
}: PgConversationLedgeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleMessages = capConversationMessages(messages);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRedirect = () => {
    if (!pendingNextStep || !onRedirect) return;
    onRedirect(pendingNextStep);
    if (CONVERSATION_LEDGE_POLICY.closeOnRedirect) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-20",
        "bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 md:right-8",
        "max-md:bottom-[max(5rem,env(safe-area-inset-bottom))]",
        className
      )}
      data-conversation-ledge
    >
      <div
        className={cn(
          "pointer-events-auto w-[min(100vw-2rem,var(--pg-conversation-ledge-width))]",
          "rounded-[var(--pg-radius-lg)] border border-[var(--pg-color-border-subtle)]",
          "bg-[var(--pg-color-canvas)]/95 shadow-[var(--pg-shadow-md)] backdrop-blur-sm"
        )}
        style={{
          ["--pg-conversation-ledge-width" as string]: `${CONVERSATION_LEDGE_POLICY.maxWidthPx}px`,
          maxHeight: open
            ? `min(${CONVERSATION_LEDGE_POLICY.maxExpandedHeightVh}vh, 240px)`
            : undefined,
        }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--pg-color-border-subtle)] px-3 py-2">
          <button
            type="button"
            onClick={() => onOpenChange(!open)}
            className="pg-focus-premium flex min-h-9 flex-1 items-center gap-2 text-left text-sm font-medium text-[var(--pg-color-text-primary)]"
            aria-expanded={open}
            aria-controls="pg-conversation-ledge-panel"
          >
            {open ? (
              <ChevronDown size={16} aria-hidden className="shrink-0 text-[var(--pg-color-text-tertiary)]" />
            ) : (
              <ChevronUp size={16} aria-hidden className="shrink-0 text-[var(--pg-color-text-tertiary)]" />
            )}
            {STUDIO_COPY.conversationLedge.collapsedLabel}
          </button>
          {open && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={STUDIO_COPY.conversationLedge.closeLabel}
              className="pg-focus-premium flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pg-radius-sm)] text-[var(--pg-color-text-secondary)] hover:bg-[var(--pg-color-accent-muted)]"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        {open && (
          <div
            id="pg-conversation-ledge-panel"
            role="region"
            aria-label={STUDIO_COPY.conversationLedge.ariaLabel}
            className="flex max-h-[calc(min(28vh,240px)-3rem)] flex-col"
          >
            <p className="shrink-0 px-3 pt-2 text-[11px] leading-snug text-[var(--pg-color-text-tertiary)]">
              {STUDIO_COPY.conversationLedge.expandedHint}
            </p>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {visibleMessages.length === 0 ? (
                <p className="py-3 text-xs text-[var(--pg-color-text-tertiary)]">
                  {STUDIO_COPY.conversationLedge.emptyHint}
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleMessages.map((message) => (
                    <li
                      key={message.id}
                      className={cn(
                        "text-xs leading-relaxed",
                        message.role === "user"
                          ? "text-[var(--pg-color-text-secondary)]"
                          : "text-[var(--pg-color-text-primary)]"
                      )}
                    >
                      <span className="font-medium text-[var(--pg-color-text-tertiary)]">
                        {message.role === "user" ? "You" : peerName}:
                      </span>{" "}
                      {message.content}
                    </li>
                  ))}
                </ul>
              )}

              {pendingNextStep && onRedirect && (
                <button
                  type="button"
                  onClick={handleRedirect}
                  className="pg-focus-premium mt-3 w-full rounded-[var(--pg-radius-sm)] border border-[var(--pg-color-border-subtle)] px-2 py-1.5 text-left text-xs text-[var(--pg-color-accent)] hover:bg-[var(--pg-color-accent-muted)]"
                >
                  {STUDIO_COPY.conversationLedge.redirectPrefix} {pendingNextStep.label} →
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex shrink-0 gap-2 border-t border-[var(--pg-color-border-subtle)] p-2"
            >
              <input
                ref={inputRef}
                type="text"
                disabled={disabled}
                placeholder={STUDIO_COPY.conversationLedge.placeholder}
                className={cn(
                  "min-h-9 min-w-0 flex-1 rounded-[var(--pg-radius-sm)] border border-[var(--pg-color-border-subtle)]",
                  "bg-transparent px-2.5 text-xs text-[var(--pg-color-text-primary)]",
                  "placeholder:text-[var(--pg-color-text-tertiary)]",
                  "focus:border-[var(--pg-color-accent)] focus:outline-none"
                )}
              />
              <PgButton type="submit" size="sm" variant="secondary" disabled={disabled}>
                {STUDIO_COPY.conversationLedge.sendLabel}
              </PgButton>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
