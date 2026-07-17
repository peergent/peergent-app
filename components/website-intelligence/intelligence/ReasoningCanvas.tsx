"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import type { BusinessBrainReasoningViewModel } from "@/lib/website-intelligence/assessment-presenter";
import { cn } from "@/lib/ui/cn";

type ReasoningCanvasProps = {
  reasoning: BusinessBrainReasoningViewModel;
};

type HoverTarget =
  | { type: "known"; index: number }
  | { type: "believe"; index: number }
  | null;

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function FlowStep() {
  return (
    <div className="flex items-center py-2 pl-[1.125rem]" aria-hidden>
      <ChevronDown size={12} className="text-white/15" strokeWidth={1.5} />
    </div>
  );
}

const confidenceFill: Record<BusinessBrainReasoningViewModel["confidence"], string> = {
  Strong: "82%",
  Growing: "62%",
  Moderate: "48%",
  Early: "32%",
};

const confidenceTone: Record<BusinessBrainReasoningViewModel["confidence"], string> = {
  Strong: "from-emerald-500/70 to-emerald-400/40",
  Growing: "from-violet-500/70 to-violet-400/40",
  Moderate: "from-violet-500/50 to-indigo-400/30",
  Early: "from-amber-500/50 to-amber-400/30",
};

export default function ReasoningCanvas({ reasoning }: ReasoningCanvasProps) {
  const [hover, setHover] = useState<HoverTarget>(null);

  function relatedBelieveIndex(knownIndex: number) {
    return Math.min(knownIndex, reasoning.likely.length - 1);
  }

  function knownHighlighted(index: number) {
    if (!hover) return false;
    if (hover.type === "known") return hover.index === index;
    if (hover.type === "believe") return relatedBelieveIndex(index) === hover.index;
    return false;
  }

  function believeHighlighted(index: number) {
    if (!hover) return false;
    if (hover.type === "believe") return hover.index === index;
    if (hover.type === "known") return index === relatedBelieveIndex(hover.index);
    return false;
  }

  const believeSectionGlow =
    hover?.type === "known" || hover?.type === "believe";
  const confidenceGlow = hover?.type === "believe";

  return (
    <section className="relative mx-auto w-full max-w-xl px-2 pb-4 pt-6 md:pt-10">
      <div
        className="pointer-events-none absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-white/[0.06]"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-white/[0.012]">
        <div
          className="pointer-events-none absolute bottom-8 left-[1.125rem] top-8 w-px bg-gradient-to-b from-emerald-500/25 via-violet-500/15 to-white/[0.05]"
          aria-hidden
        />

        <div className="relative px-5 py-7 md:px-7 md:py-8">
          <Reveal delay={60}>
            <div>
              <p className="pl-7 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-400/70">
                What we know
              </p>
              <ul className="mt-2.5 space-y-0.5">
                {reasoning.observed.map((label, index) => (
                  <li key={label}>
                    <div
                      role="presentation"
                      onMouseEnter={() => setHover({ type: "known", index })}
                      onMouseLeave={() => setHover(null)}
                      className={cn(
                        "-ml-1 flex items-center gap-2.5 rounded-[14px] py-1.5 pl-8 pr-2 transition duration-300",
                        knownHighlighted(index) && "bg-emerald-500/[0.06]"
                      )}
                    >
                      <Check
                        size={12}
                        className="shrink-0 text-emerald-400/80"
                        strokeWidth={2.5}
                      />
                      <span className="text-sm font-medium text-white/90">{label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <FlowStep />
          </Reveal>

          <Reveal delay={280}>
            <div
              className={cn(
                "-mx-1 rounded-[16px] px-1 transition duration-500",
                believeSectionGlow && "bg-violet-500/[0.03]"
              )}
            >
              <p className="pl-7 text-[10px] font-medium uppercase tracking-[0.14em] text-violet-400/55">
                What we believe
              </p>
              <ul className="mt-2.5 space-y-0.5">
                {reasoning.likely.map((label, index) => (
                  <li key={label}>
                    <div
                      role="presentation"
                      onMouseEnter={() => setHover({ type: "believe", index })}
                      onMouseLeave={() => setHover(null)}
                      className={cn(
                        "rounded-[14px] py-1.5 pl-8 pr-2 transition duration-300",
                        believeHighlighted(index) && "bg-violet-500/[0.07]"
                      )}
                    >
                      <span className="text-sm text-slate-500">{label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {reasoning.waitingFor.length > 0 && (
            <>
              <Reveal delay={400}>
                <FlowStep />
              </Reveal>

              <Reveal delay={480}>
                <div>
                  <p className="pl-7 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                    Waiting for
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-8">
                    {reasoning.waitingFor.map((chip) =>
                      chip.href ? (
                        <Link
                          key={chip.id}
                          href={chip.href}
                          className="rounded-full border border-dashed border-white/[0.1] px-3 py-1 text-[11px] text-slate-600 transition duration-200 hover:border-violet-500/20 hover:text-slate-400"
                        >
                          {chip.label}
                        </Link>
                      ) : (
                        <span
                          key={chip.id}
                          className="rounded-full border border-dashed border-white/[0.08] px-3 py-1 text-[11px] text-slate-700"
                        >
                          {chip.label}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </Reveal>
            </>
          )}

          <Reveal delay={580}>
            <FlowStep />
          </Reveal>

          <Reveal delay={660}>
            <div
              className={cn(
                "-mx-1 rounded-[16px] px-1 py-0.5 transition duration-500",
                confidenceGlow && "bg-violet-500/[0.04]"
              )}
            >
              <p className="pl-7 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                Confidence
              </p>
              <div className="mt-2.5 flex items-center gap-3 pl-8 pr-1">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out",
                      confidenceTone[reasoning.confidence],
                      confidenceGlow && "shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                    )}
                    style={{ width: confidenceFill[reasoning.confidence] }}
                  />
                </div>
                <span className="text-xs font-medium text-white/70">
                  {reasoning.confidence}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
