import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrainCore from "@/components/website-intelligence/intelligence/BrainCore";
import { cn } from "@/lib/ui/cn";

type EmptyTeamStateProps = {
  reducedMotion?: boolean;
};

export default function EmptyTeamState({ reducedMotion }: EmptyTeamStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-4 py-20 text-center md:py-28",
        !reducedMotion && "pg-section-enter"
      )}
    >
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-10 rounded-full bg-violet-500/[0.06] blur-3xl"
          aria-hidden
        />
        <BrainCore size="lg" className="h-16 w-16 opacity-80" />
      </div>

      <h1 className="mt-10 max-w-md text-[1.75rem] font-semibold tracking-tight text-white md:text-[2rem]">
        Build your first AI Team
      </h1>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-500">
        Start with Website Intelligence to meet Sales Peer and Marketing Peer — then
        welcome them into your company.
      </p>

      <Link
        href="/website-intelligence"
        className="pg-hover-lift pg-focus-premium mt-10 inline-flex min-h-11 items-center gap-2 rounded-[18px] bg-white px-7 py-3.5 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-500/[0.08] transition active:scale-[0.98]"
      >
        Start with Website Intelligence
        <ArrowRight size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}
