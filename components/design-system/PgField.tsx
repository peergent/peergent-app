import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * §2 Inputs. Label in the mono utility face (the system asking), value in the
 * proportional face (the person answering).
 *
 * §2 Errors explain what went wrong and how to fix it — no apologies, no
 * vagueness.
 */

const CONTROL = cn(
  "w-full rounded-[var(--pg-radius-sm)] border bg-[var(--pg-color-canvas)]",
  "border-[var(--pg-color-border)] px-3 py-2.5",
  "text-[var(--pg-type-body-sm)] text-[var(--pg-color-text-primary)]",
  "placeholder:text-[var(--pg-color-text-tertiary)]",
  "transition-colors duration-[var(--pg-duration-state)]",
  "hover:border-[var(--pg-color-border-strong,var(--pg-color-border))]",
  "focus:outline-none focus:border-[var(--pg-color-accent)]",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

type FieldShellProps = {
  label?: string;
  hint?: string;
  error?: string;
  controlId: string;
  children: React.ReactNode;
  className?: string;
};

function FieldShell({
  label,
  hint,
  error,
  controlId,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-[var(--pg-space-2)]", className)}>
      {label ? (
        <label htmlFor={controlId} className="pg-label">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${controlId}-error`}
          className="pg-body pg-body--sm text-[var(--pg-color-error)]"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${controlId}-hint`} className="pg-body pg-body--sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type PgInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function PgInput({
  label,
  hint,
  error,
  className,
  wrapperClassName,
  ...props
}: PgInputProps) {
  const id = useId();
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      controlId={id}
      className={wrapperClassName}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          "pg-focus-premium",
          CONTROL,
          error && "border-[var(--pg-color-error)]",
          className
        )}
        {...props}
      />
    </FieldShell>
  );
}

export type PgTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function PgTextarea({
  label,
  hint,
  error,
  className,
  wrapperClassName,
  rows = 4,
  ...props
}: PgTextareaProps) {
  const id = useId();
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      controlId={id}
      className={wrapperClassName}
    >
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          "pg-focus-premium resize-y",
          CONTROL,
          error && "border-[var(--pg-color-error)]",
          className
        )}
        {...props}
      />
    </FieldShell>
  );
}
