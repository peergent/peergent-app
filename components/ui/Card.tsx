import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type CardVariant = "default" | "interactive";
type CardElevation = "base" | "raised" | "inset" | "hero";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  elevation?: CardElevation;
  padding?: "none" | "sm" | "md" | "lg" | "hero";
  children: ReactNode;
};

const elevationStyles: Record<CardElevation, string> = {
  base: "border-white/10 bg-[#0b1120]/90",
  raised: "border-white/10 bg-[#0c1324]/95",
  inset: "border-white/[0.06] bg-white/[0.02] shadow-none",
  hero: "border-white/10 border-l-2 border-l-[var(--pg-accent-edge)] bg-[#0b1120]/95 bg-[linear-gradient(135deg,rgba(124,58,237,0.05)_0%,transparent_50%)] shadow-none",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
  hero: "p-8 md:p-10 lg:p-12",
};

export default function Card({
  variant = "default",
  elevation = "base",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--pg-radius-xl)] border backdrop-blur",
        "transition-[transform,border-color,background-color] duration-[var(--pg-duration-base)] ease-[var(--pg-ease-standard)]",
        elevationStyles[elevation],
        elevation === "base" &&
          variant === "default" &&
          "shadow-xl shadow-black/10",
        elevation === "raised" && "shadow-[var(--pg-shadow-md)]",
        paddingStyles[padding],
        variant === "interactive" &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-white/[0.16] active:translate-y-0 active:scale-[0.995]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
