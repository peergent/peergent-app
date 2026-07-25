import type { CcServicePerformance } from "@/lib/home/build-command-center-view-model";
import { AgentPerformanceCard } from "./AgentPerformanceCard";

export function AgentPerformanceGrid({ services }: { services: CcServicePerformance[] }) {
  if (services.length === 0) return null;

  return (
    <section className="command-center__section command-center__section--delay-25" aria-labelledby="cc-services-title">
      <h2 className="command-center__panel-title" id="cc-services-title">
        Agent performance
      </h2>
      <div className="command-center__agent-row">
        {services.map((service) => (
          <AgentPerformanceCard key={service.serviceKey} service={service} />
        ))}
      </div>
    </section>
  );
}
