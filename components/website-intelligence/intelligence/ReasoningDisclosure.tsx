"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type ReasoningDisclosureProps = {
  children: ReactNode;
  className?: string;
};

export default function ReasoningDisclosure({
  children,
  className,
}: ReasoningDisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 transition hover:text-slate-400"
      >
        Why Brain believes this
        <ChevronDown
          size={12}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-xs leading-5 text-slate-500">
          {children}
        </div>
      )}
    </div>
  );
}
