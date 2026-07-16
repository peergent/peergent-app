import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type SurfaceRevealDirection = "up" | "down" | "none";

export type SurfaceRevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Stagger delay in ms — use inside FadeSequence or manual offsets. */
  delay?: number;
  direction?: SurfaceRevealDirection;
  /** When true, animates on mount. Default true. */
  animate?: boolean;
};

const directionStyles: Record<SurfaceRevealDirection, string> = {
  up: "pg-surface-reveal-up",
  down: "pg-surface-reveal-down",
  none: "pg-surface-reveal",
};

export default function SurfaceReveal({
  children,
  delay = 0,
  direction = "up",
  animate = true,
  className,
  style,
  ...props
}: SurfaceRevealProps) {
  return (
    <div
      className={cn(animate && directionStyles[direction], className)}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
