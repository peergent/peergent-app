import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type InsetGroupProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md";
  interactive?: boolean;
  children: ReactNode;
};

const paddingStyles = {
  sm: "p-4",
  md: "p-5 md:p-6",
};

export default function InsetGroup({
  padding = "md",
  interactive = false,
  className,
  children,
  ...props
}: InsetGroupProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--pg-radius-lg)] border border-white/[0.06] bg-white/[0.02]",
        paddingStyles[padding],
        interactive &&
          "transition-[transform,border-color,background-color] duration-[var(--pg-duration-base)] hover:-translate-y-0.5 hover:border-white/[0.1] hover:bg-white/[0.025]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
