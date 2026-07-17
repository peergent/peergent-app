import { ArrowRight } from "lucide-react";
import EmployeeCard from "@/components/hire-team/EmployeeCard";
import { hireBtnSecondary, hireWhisper } from "@/lib/hire-team/hire-ui";
import type { HireTeamViewModel } from "@/lib/hire-team/hire-team-presenter";
import { cn } from "@/lib/ui/cn";

type HireTeamIntroProps = {
  model: HireTeamViewModel;
  onContinue: () => void;
  teamHovered: boolean;
  onTeamHover: (hovered: boolean) => void;
  reducedMotion: boolean;
};

export default function HireTeamIntro({
  model,
  onContinue,
  teamHovered,
  onTeamHover,
  reducedMotion,
}: HireTeamIntroProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className={cn("text-center", hireWhisper)}>Recommended revenue team</p>

      <div
        className="relative mt-8"
        onMouseEnter={() => onTeamHover(true)}
        onMouseLeave={() => onTeamHover(false)}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-[15%] top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-500/15 to-transparent transition-opacity duration-500 md:block",
            teamHovered ? "opacity-100" : "opacity-40"
          )}
          aria-hidden
        />

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <EmployeeCard
            employee={model.salesPeer}
            highlighted={teamHovered}
            delayClass={reducedMotion ? undefined : "pg-section-enter"}
          />
          <EmployeeCard
            employee={model.marketingPeer}
            highlighted={teamHovered}
            delayClass={
              reducedMotion ? undefined : "pg-section-enter [animation-delay:120ms]"
            }
          />
        </div>
      </div>

      <p className="mt-8 text-center text-[13px] leading-relaxed text-slate-600">
        Marketing creates demand. Sales turns it into conversations.
      </p>

      <div className="flex justify-center">
        <button type="button" onClick={onContinue} className={cn("mt-12", hireBtnSecondary)}>
          Prepare their workspace
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
