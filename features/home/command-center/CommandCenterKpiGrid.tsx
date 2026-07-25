import type { CcMetricCard } from "@/lib/home/build-command-center-view-model";
import { CommandCenterKpiCard } from "./CommandCenterKpiCard";

export function CommandCenterKpiGrid({ metrics }: { metrics: CcMetricCard[] }) {
  return (
    <section className="command-center__metrics-row command-center__section command-center__section--delay-05" aria-label="Overview metrics">
      {metrics.map((metric) => (
        <CommandCenterKpiCard key={metric.id} metric={metric} />
      ))}
    </section>
  );
}
