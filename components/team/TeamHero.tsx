import type { TeamWorkspaceViewModel } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";

type TeamHeroProps = {
  model: Pick<TeamWorkspaceViewModel, "greeting" | "companyName" | "subheadline">;
  reducedMotion?: boolean;
};

export default function TeamHero({ model, reducedMotion }: TeamHeroProps) {
  return (
    <header className={cn(!reducedMotion && "pg-section-enter")}>
      <h1 className="text-xl font-semibold tracking-tight text-[var(--pg-text)] md:text-2xl">
        Your AI Team
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--pg-text-muted)]">
        {model.greeting}, {model.companyName}.
      </p>
      <p className="mt-0.5 text-sm text-[var(--pg-text-subtle)]">{model.subheadline}</p>
    </header>
  );
}
