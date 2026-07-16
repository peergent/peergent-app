import { ArrowRight, Brain } from "lucide-react";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import InsetGroup from "@/components/ui/InsetGroup";
import DataLabelBadge from "@/components/dashboard/DataLabelBadge";
import SystemState from "@/components/ui/SystemState";
import type { ExecutiveBrief } from "@/lib/command-center/types";
import type { MemoryEntry } from "@/lib/command-center/presence";
import type { PresenceMode } from "@/components/ui/PresenceIndicator";
import type { GreetingData } from "@/lib/command-center/types";

type ExecutiveDailyBriefProps = {
  brief: ExecutiveBrief;
  greeting: GreetingData;
  briefedAt: string;
  systemState: { mode: PresenceMode; label: string; context?: string };
  reasoning: string[];
  memory: MemoryEntry[];
};

export default function ExecutiveDailyBrief({
  brief,
  greeting,
  briefedAt,
  systemState,
  reasoning,
  memory,
}: ExecutiveDailyBriefProps) {
  const action = brief.primaryAction;
  const conclusion = brief.conclusion ?? brief.summary ?? "";
  const rationale = brief.rationale ?? "";

  return (
    <section className="pg-animate-in max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pg-radius-md)] border border-white/[0.08] bg-white/[0.03] text-violet-400/90">
            <Brain size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[11px] font-medium tabular-nums uppercase tracking-[0.08em] text-slate-600">
              01
            </p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-white">
              Business Brain
            </h2>
            <SystemState
              mode={systemState.mode}
              label={systemState.label}
              context={briefedAt}
              className="mt-2"
            />
          </div>
        </div>
        <DataLabelBadge label="demo-insight" />
      </div>

      <p className="mt-10 text-base text-slate-400">
        {greeting.salutation}, {greeting.name}.
      </p>

      <div className="mt-8">
        <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
          Today&apos;s conclusion
        </p>
        <p className="mt-3 text-xl font-medium leading-relaxed tracking-tight text-[var(--pg-text-headline)] md:text-2xl md:leading-relaxed">
          {conclusion}
        </p>
        {rationale && (
          <p className="mt-3 text-sm leading-6 text-slate-500">{rationale}</p>
        )}
      </div>

      <div className="mt-10">
        {action.href && !action.disabled ? (
          <ButtonLink
            href={action.href}
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={16} />}
          >
            {action.label}
          </ButtonLink>
        ) : (
          <Button disabled size="md">
            {action.label}
          </Button>
        )}
      </div>

      {reasoning.length > 0 && (
        <InsetGroup padding="md" className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
            How I know this
          </p>
          <ul className="mt-3 space-y-2">
            {reasoning.map((line) => (
              <li
                key={line}
                className="flex gap-3 text-sm leading-6 text-slate-400"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/60" />
                {line}
              </li>
            ))}
          </ul>
        </InsetGroup>
      )}

      {memory.length > 0 && (
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-slate-600">
              Previously noted
            </p>
            <DataLabelBadge label="demo-data" />
          </div>
          <ul className="mt-2 space-y-1">
            {memory.map((entry) => (
              <li key={entry.id} className="text-sm text-slate-500">
                {entry.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
