"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/ui/cn";

export type EmmaSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
};

export default function EmmaSection({
  id,
  title,
  subtitle,
  badge,
  children,
  className,
}: EmmaSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("emma-section", className)}
    >
      <header className="emma-section__header">
        <div>
          <h2 className="emma-section__title">{title}</h2>
          {subtitle && <p className="emma-section__subtitle">{subtitle}</p>}
        </div>
        {badge && <span className="emma-section__badge">{badge}</span>}
      </header>
      {children}
    </motion.section>
  );
}
