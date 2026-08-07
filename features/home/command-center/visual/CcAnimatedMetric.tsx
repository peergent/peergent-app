"use client";

import { useCounterAnimation } from "@/lib/design-system/useCounterAnimation";
import type { LucideIcon } from "lucide-react";

export function CcAnimatedMetric({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const display = useCounterAnimation(value, true);
  return <span className={className}>{display}</span>;
}

export type CcKpiTileProps = {
  id: string;
  label: string;
  value: string;
  trend?: string | null;
  icon: LucideIcon;
  href?: string | null;
  accent?: string;
  hero?: boolean;
};
