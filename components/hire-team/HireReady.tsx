import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrainCore from "@/components/website-intelligence/intelligence/BrainCore";
import {
  hireBtnPrimary,
  hireHeadline,
  hireSupport,
} from "@/lib/hire-team/hire-ui";
import type { HireTeamViewModel } from "@/lib/hire-team/hire-team-presenter";
import { cn } from "@/lib/ui/cn";

type HireReadyProps = {
  model: HireTeamViewModel;
  onMeetTeam: () => void;
  reducedMotion?: boolean;
};

function ReadyRow({
  name,
  status,
  statusClass,
  delayClass,
}: {
  name: string;
  status: string;
  statusClass: string;
  delayClass?: string;
}) {
  return (
    <li
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 rounded-[18px] border border-white/[0.05] bg-white/[0.015] px-5 py-3.5",
        delayClass
      )}
    >
      <span className="min-w-0 truncate text-sm font-medium tracking-tight text-white/90">
        {name}
      </span>
      <span className={cn("text-[11px] font-medium", statusClass)}>{status}</span>
    </li>
  );
}

export default function HireReady({ model, onMeetTeam, reducedMotion }: HireReadyProps) {
  return (
    <div className="flex w-full flex-col items-center overflow-hidden text-center">
      <div className="relative isolate">
        <div
          className={cn(
            "pointer-events-none absolute -inset-12 -z-10 rounded-full bg-violet-500/[0.06] blur-3xl",
            !reducedMotion && "pg-breathe"
          )}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-emerald-500/[0.03] blur-2xl"
          aria-hidden
        />
        <BrainCore
          size="lg"
          className={cn("h-14 w-14", !reducedMotion && "pg-section-enter")}
        />
      </div>

      <h1
        className={cn(
          "mt-10 max-w-md",
          hireHeadline,
          !reducedMotion && "pg-section-enter [animation-delay:100ms]"
        )}
      >
        Your AI team is ready
      </h1>
      <p
        className={cn(
          "mt-4",
          hireSupport,
          !reducedMotion && "pg-section-enter [animation-delay:160ms]"
        )}
      >
        {model.salesPeer.name} and {model.marketingPeer.name} are ready to start working
        with {model.companyName}.
      </p>

      <ul className="mt-10 w-full space-y-2">
        <ReadyRow
          name={model.salesPeer.name}
          status="Ready"
          statusClass="text-emerald-400/75"
          delayClass={!reducedMotion ? "pg-section-enter [animation-delay:220ms]" : undefined}
        />
        <ReadyRow
          name={model.marketingPeer.name}
          status="Ready"
          statusClass="text-emerald-400/75"
          delayClass={!reducedMotion ? "pg-section-enter [animation-delay:280ms]" : undefined}
        />
        <ReadyRow
          name="Business Brain"
          status="Watching"
          statusClass="text-violet-400/65"
          delayClass={!reducedMotion ? "pg-section-enter [animation-delay:340ms]" : undefined}
        />
      </ul>

      <button
        type="button"
        onClick={onMeetTeam}
        className={cn(
          "mt-12",
          hireBtnPrimary,
          !reducedMotion && "pg-section-enter [animation-delay:420ms]"
        )}
      >
        Meet your AI Team
        <ArrowRight size={16} strokeWidth={2} />
      </button>
      <Link
        href="/knowledge"
        className={cn(
          "mt-6 text-xs text-slate-700 transition hover:text-slate-500",
          !reducedMotion && "pg-section-enter [animation-delay:480ms]"
        )}
      >
        Connect more company data
      </Link>
    </div>
  );
}
