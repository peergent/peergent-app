"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/ui/cn";

export type EmmaWorkspaceSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

export default function EmmaWorkspaceSection({
  title,
  subtitle,
  children,
  className,
  id,
}: EmmaWorkspaceSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn("emma-workspace-section", className)}
    >
      <header className="emma-workspace-section__header">
        <h2 className="emma-workspace-section__title">{title}</h2>
        {subtitle && <p className="emma-workspace-section__subtitle">{subtitle}</p>}
      </header>
      {children}
    </motion.section>
  );
}
