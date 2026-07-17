"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type HireTeamCTAProps = {
  onHireTeam: () => void;
};

export default function HireTeamCTA({ onHireTeam }: HireTeamCTAProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={cn(
        "relative mx-auto max-w-xl px-2 py-24 text-center transition-all duration-700 ease-out md:py-32",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div
        className="pointer-events-none absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-gradient-to-b from-white/[0.06] to-transparent"
        aria-hidden
      />
      <h2 className="text-lg font-medium tracking-tight text-white md:text-xl">
        Ready to put your AI team to work?
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500">
        Everything the Business Brain has learned points to one clear next step.
      </p>
      <button
        type="button"
        onClick={onHireTeam}
        className="pg-hover-lift mt-8 inline-flex items-center gap-2 rounded-[18px] bg-white px-8 py-3.5 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-500/10 transition active:scale-[0.98]"
      >
        Hire Team
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
