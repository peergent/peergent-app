"use client";

import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/ui/cn";

type MayaPresenceProps = {
  name: string;
  role?: string;
  visible: boolean;
  recognized: boolean;
  className?: string;
};

export default function MayaPresence({
  name,
  role = "Marketing",
  visible,
  recognized,
  className,
}: MayaPresenceProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center md:items-end",
        "transition-opacity duration-[500ms] ease-out",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
      aria-hidden={!visible}
    >
      <div
        className={cn(
          "handoff-maya-recognize relative transition-transform duration-[350ms] ease-out",
          recognized && "handoff-maya-recognized"
        )}
      >
        <Avatar
          name={name}
          size="xl"
          gradient="from-[#7c6fe0] to-[#5b4fc7]"
          className="h-[72px] w-[72px] text-lg shadow-lg shadow-black/30 md:h-20 md:w-20"
        />
        <span
          className="handoff-maya-ring pointer-events-none absolute inset-0 rounded-[var(--pg-radius-xl)]"
          aria-hidden
        />
      </div>
      <p className="mt-3 text-center text-sm font-medium text-[var(--pg-color-text-primary)] md:text-right">
        {name}
      </p>
      <p className="text-center text-[11px] uppercase tracking-wider text-[var(--pg-color-text-tertiary)] md:text-right">
        {role}
      </p>
    </div>
  );
}
