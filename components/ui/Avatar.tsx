import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type AvatarSize = "sm" | "md" | "lg" | "xl";
type AvatarPresence = "live" | "idle" | "offline";

export type AvatarProps = {
  name?: string;
  icon?: ReactNode;
  gradient?: string;
  size?: AvatarSize;
  presence?: AvatarPresence;
  className?: string;
};

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-9 w-9 text-xs rounded-[var(--pg-radius-md)]",
  md: "h-11 w-11 text-sm rounded-[var(--pg-radius-lg)]",
  lg: "h-14 w-14 text-base rounded-[var(--pg-radius-xl)]",
  xl: "h-16 w-16 text-lg rounded-[var(--pg-radius-xl)]",
};

const presenceRing: Record<AvatarPresence, string> = {
  live: "ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-[#0b1120]",
  idle: "ring-1 ring-white/10 ring-offset-1 ring-offset-[#0b1120]",
  offline: "ring-1 ring-white/5 opacity-80",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Avatar({
  name,
  icon,
  gradient = "from-violet-500 to-blue-600",
  size = "md",
  presence,
  className,
}: AvatarProps) {
  return (
    <div className="relative inline-flex shrink-0">
      {presence === "live" && (
        <span
          className="absolute -right-0.5 -top-0.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-[#0b1120] bg-emerald-400 pg-pulse-live"
          aria-hidden
        />
      )}
      <div
        className={cn(
          "inline-flex items-center justify-center bg-gradient-to-br font-semibold text-white shadow-md shadow-black/20",
          gradient,
          sizeStyles[size],
          presence && presenceRing[presence],
          className
        )}
        aria-hidden={!name}
      >
        {icon ?? (name ? getInitials(name) : "?")}
      </div>
    </div>
  );
}
