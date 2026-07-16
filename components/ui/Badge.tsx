import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

type BadgeSize = "sm" | "md";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-white/10 bg-white/[0.04] text-slate-400",
  accent: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/20 bg-red-500/10 text-red-300",
  neutral: "border-white/10 bg-white/[0.03] text-slate-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export default function Badge({
  variant = "default",
  size = "md",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
