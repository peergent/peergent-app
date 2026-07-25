import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type PgButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type PgButtonSize = "sm" | "md" | "lg";

export type PgButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PgButtonVariant;
  size?: PgButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantStyles: Record<PgButtonVariant, string> = {
  primary: [
    "bg-[var(--pg-color-accent)] text-[var(--pg-color-text-inverse)]",
    "hover:bg-[var(--pg-color-accent-hover)]",
    "active:bg-[var(--pg-color-accent-pressed)] active:scale-[0.98]",
  ].join(" "),
  secondary: [
    "border border-[var(--pg-color-border)] text-[var(--pg-color-text-primary)]",
    "hover:bg-[var(--pg-color-accent-muted)]",
  ].join(" "),
  ghost: [
    "text-[var(--pg-color-text-secondary)]",
    "hover:bg-[var(--pg-color-accent-muted)] hover:text-[var(--pg-color-text-primary)]",
  ].join(" "),
  danger: [
    "border border-[var(--pg-color-error)]/25 bg-[var(--pg-color-error-muted)]",
    "text-[var(--pg-color-error)] hover:bg-[var(--pg-color-error-muted)]",
  ].join(" "),
};

const sizeStyles: Record<PgButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-xs gap-1.5 rounded-[var(--pg-radius-sm)]",
  md: "min-h-11 px-5 text-sm gap-2 rounded-[var(--pg-radius-md)]",
  lg: "min-h-12 px-6 text-sm gap-2 rounded-[var(--pg-radius-md)]",
};

export default function PgButton({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: PgButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "pg-focus-premium inline-flex items-center justify-center font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          className="pg-spinner h-4 w-4 rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
