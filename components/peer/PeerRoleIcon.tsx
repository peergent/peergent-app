"use client";

import type { LucideProps } from "lucide-react";
import {
  Bot,
  CalendarDays,
  Headphones,
  Megaphone,
  TrendingUp,
} from "lucide-react";

const ROLE_ICONS = {
  Sales: TrendingUp,
  Support: Headphones,
  Marketing: Megaphone,
  Planning: CalendarDays,
  Finance: TrendingUp,
  Custom: Bot,
} as const;

type PeerRoleIconProps = LucideProps & {
  role: string;
};

export default function PeerRoleIcon({ role, ...props }: PeerRoleIconProps) {
  const Icon = ROLE_ICONS[role as keyof typeof ROLE_ICONS] ?? Bot;
  return <Icon {...props} />;
}
