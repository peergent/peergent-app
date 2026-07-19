import PeerWorkspaceCard from "@/components/team/PeerWorkspaceCard";
import TeamActivityFeed from "@/components/team/TeamActivityFeed";
import TeamHero from "@/components/team/TeamHero";
import TeamStats from "@/components/team/TeamStats";
import WorkforceSummaryCard from "@/components/team/WorkforceSummary";
import type { TeamWorkspaceViewModel } from "@/lib/team/types";

type TeamWorkspaceProps = {
  model: TeamWorkspaceViewModel;
  reducedMotion?: boolean;
};

export default function TeamWorkspace({ model, reducedMotion }: TeamWorkspaceProps) {
  const hasStats = model.impactStats.length > 0;
  const hasActivity = model.activity.length > 0;

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <TeamHero model={model} reducedMotion={reducedMotion} />
      {hasStats && <TeamStats stats={model.impactStats} reducedMotion={reducedMotion} />}

      <div
        className={
          hasActivity
            ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-8 lg:items-start"
            : "flex flex-col gap-5"
        }
      >
        {hasActivity && (
          <aside className="order-1 lg:order-2 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:self-start">
            <TeamActivityFeed events={model.activity} reducedMotion={reducedMotion} />
          </aside>
        )}

        <section
          aria-labelledby="team-workspace-heading"
          className={hasActivity ? "order-2 flex flex-col gap-5 lg:order-1" : "flex flex-col gap-5"}
        >
          <h2 id="team-workspace-heading" className="sr-only">
            Featured AI peers
          </h2>
          {model.featuredPeers.map((peer, index) => (
            <PeerWorkspaceCard
              key={peer.id}
              peer={peer}
              delayClass={
                reducedMotion
                  ? undefined
                  : `pg-section-enter [animation-delay:${120 + index * 80}ms]`
              }
            />
          ))}
          {model.workforceSummary && (
            <WorkforceSummaryCard
              summary={model.workforceSummary}
              reducedMotion={reducedMotion}
            />
          )}
        </section>
      </div>
    </div>
  );
}
