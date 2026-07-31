"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/ui/cn";

/**
 * §5 Ask input — accepts an unstructured question. One line, expands on focus.
 *
 * §11.8 Conversation lives on the object, never in an inbox. Replies thread
 * onto whatever the question was about; this control never accumulates a
 * transcript.
 *
 * §8.1 While the customer is typing the presence line freezes — she does not
 * talk over them. That is signalled through `onFocusChange`.
 */

export type PgAskInputProps = {
  peerName: string;
  /**
   * Supplied by the view model so the prompt is both localized and free of
   * domain nouns — a Sales or Support Peer is not asked about marketing.
   */
  placeholder?: string;
  onSubmit: (question: string) => void;
  /** Lets the shell freeze the presence line while typing. */
  onFocusChange?: (focused: boolean) => void;
  disabled?: boolean;
  className?: string;
  testId?: string;
};

export default function PgAskInput({
  peerName,
  placeholder,
  onSubmit,
  onFocusChange,
  disabled = false,
  className,
  testId,
}: PgAskInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const canSubmit = value.trim().length > 0 && !disabled;

  function submit() {
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue("");
  }

  return (
    <form
      className={cn(
        "flex items-end gap-[var(--pg-space-3)] rounded-[var(--pg-radius-md)]",
        "border bg-[var(--pg-office-panel)]",
        "px-[var(--pg-space-4)] py-[var(--pg-space-3)]",
        "transition-[border-color,box-shadow] duration-[var(--pg-duration-state)]",
        focused
          ? "border-[var(--pg-color-accent)]"
          : "border-[var(--pg-office-line)] hover:border-[var(--pg-office-line-strong)]",
        className
      )}
      style={{
        boxShadow: focused
          ? `0 0 0 3px var(--pg-office-glow), var(--pg-office-lift)`
          : "var(--pg-office-lift)",
      }}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      data-testid={testId ?? "pg-ask-input"}
    >
      <textarea
        value={value}
        rows={focused || value ? 3 : 1}
        disabled={disabled}
        placeholder={placeholder ?? `Ask ${peerName}…`}
        aria-label={placeholder ?? `Ask ${peerName}…`}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => {
          setFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setFocused(false);
          onFocusChange?.(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        className={cn(
          "pg-focus-premium max-h-40 flex-1 resize-none bg-transparent",
          "text-[var(--pg-type-body-sm)] text-[var(--pg-color-text-primary)]",
          "placeholder:text-[var(--pg-color-text-tertiary)]",
          "outline-none disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Send"
        className={cn(
          "pg-focus-premium inline-flex h-7 w-7 shrink-0 items-center justify-center",
          "rounded-[var(--pg-radius-sm)] transition",
          canSubmit
            ? "bg-[var(--pg-color-accent)] text-[var(--pg-color-text-inverse)]"
            : "text-[var(--pg-color-text-tertiary)]"
        )}
      >
        <ArrowUp size={14} aria-hidden />
      </button>
    </form>
  );
}
