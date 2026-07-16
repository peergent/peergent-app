import { cn } from "@/lib/ui/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-violet-600 text-white shadow-md shadow-violet-950/25 hover:bg-violet-500 hover:brightness-105 focus-visible:ring-violet-500/40",
  secondary:
    "border border-white/10 bg-transparent text-slate-300 hover:border-white/15 hover:bg-white/[0.04] focus-visible:ring-white/20",
  ghost:
    "text-slate-400 hover:bg-white/5 hover:text-slate-200 focus-visible:ring-white/20",
  danger:
    "bg-red-500/15 text-red-300 border border-red-500/20 hover:bg-red-500/20 focus-visible:ring-red-500/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs gap-1.5 rounded-[var(--pg-radius-md)]",
  md: "h-12 px-5 text-sm gap-2 rounded-[var(--pg-radius-md)]",
  lg: "h-12 px-6 text-sm gap-2 rounded-[var(--pg-radius-lg)]",
};

export type ButtonVariantOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariantOptions = {}) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,transform,filter] duration-[var(--pg-duration-base)] ease-[var(--pg-ease-standard)] focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}
