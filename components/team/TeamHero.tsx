import type { TeamWorkspaceViewModel } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";

type TeamHeroProps = {
  model: Pick<TeamWorkspaceViewModel, "greeting" | "companyName" | "subheadline">;
  reducedMotion?: boolean;
};

export default function TeamHero({ model, reducedMotion }: TeamHeroProps) {
  return (
    <header className={cn(!reducedMotion && "pg-section-enter")}>
      <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
        Your AI Team
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
        {model.greeting}, {model.companyName}.
      </p>
      <p className="mt-0.5 text-sm text-slate-500">{model.subheadline}</p>
    </header>
  );
}
