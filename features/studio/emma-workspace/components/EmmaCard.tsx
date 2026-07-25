"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/ui/cn";

export type EmmaCardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  selected?: boolean;
};

export default function EmmaCard({
  children,
  className,
  interactive = false,
  onClick,
  selected = false,
}: EmmaCardProps) {
  const reduceMotion = useReducedMotion();
  const Component = interactive ? motion.button : motion.div;

  return (
    <Component
      type={interactive ? "button" : undefined}
      onClick={onClick}
      whileHover={
        reduceMotion || !interactive
          ? undefined
          : { y: -2, transition: { duration: 0.2 } }
      }
      animate={
        reduceMotion
          ? undefined
          : {
              boxShadow: selected
                ? "var(--emma-card-shadow-selected)"
                : "var(--emma-card-shadow)",
            }
      }
      className={cn(
        "emma-card",
        interactive && "emma-card--interactive pg-focus-premium",
        selected && "emma-card--selected",
        className
      )}
    >
      {children}
    </Component>
  );
}
