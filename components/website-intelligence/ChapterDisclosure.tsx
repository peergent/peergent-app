"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type ChapterDisclosureProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

export default function ChapterDisclosure({
  label = "View evidence",
  children,
  className,
}: ChapterDisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("mt-5", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-400"
      >
        {label}
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && <div className="mt-4 border-t border-white/[0.06] pt-4">{children}</div>}
    </div>
  );
}
