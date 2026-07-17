import { ArrowRight } from "lucide-react";
import BrainCore from "@/components/website-intelligence/intelligence/BrainCore";
import {
  hireBtnSecondary,
  hireHeadline,
  hireSupport,
  hireWhisper,
} from "@/lib/hire-team/hire-ui";
import type { HireTeamViewModel } from "@/lib/hire-team/hire-team-presenter";
import { cn } from "@/lib/ui/cn";

type HireWelcomeProps = {
  model: HireTeamViewModel;
  onContinue: () => void;
  reducedMotion: boolean;
};

export default function HireWelcome({ model, onContinue, reducedMotion }: HireWelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <BrainCore
        size="lg"
        className={cn(
          "h-12 w-12 opacity-70",
          !reducedMotion && "pg-section-enter"
        )}
      />
      <p
        className={cn(
          "mt-14",
          hireWhisper,
          !reducedMotion && "pg-section-enter [animation-delay:60ms]"
        )}
      >
        Hiring your AI team
      </p>
      <h1
        className={cn(
          "mt-5 max-w-md",
          hireHeadline,
          !reducedMotion && "pg-section-enter [animation-delay:120ms]"
        )}
      >
        Your first AI team is ready to join
      </h1>
      <p
        className={cn(
          "mt-5",
          hireSupport,
          !reducedMotion && "pg-section-enter [animation-delay:180ms]"
        )}
      >
        {model.salesPeer.name} and {model.marketingPeer.name} are joining{" "}
        {model.companyName}.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className={cn(
          "mt-14",
          hireBtnSecondary,
          !reducedMotion && "pg-section-enter [animation-delay:240ms]"
        )}
      >
        Meet your team
        <ArrowRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
