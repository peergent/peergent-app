import Link from "next/link";
import type { CcServicePerformance } from "@/lib/home/build-command-center-view-model";
import { gaugeStrokeOffset } from "@/lib/home/cc-chart-paths";
import { CcPeerIcon } from "./components/CcPeerIcon";
import { CcMiniSparkline } from "./components/CcMetricSparkline";

const SPARK_COLORS: Record<string, string> = {
  sales: "#3b82f6",
  marketing: "#8b5cf6",
  finance: "#22d3ee",
  support: "#10b981",
  operations: "#a9a0f5",
};

const MUTED_SPARK = "rgba(255, 255, 255, 0.22)";

export function AgentPerformanceCard({ service }: { service: CcServicePerformance }) {
  const color = service.sparkMuted
    ? MUTED_SPARK
    : (SPARK_COLORS[service.serviceKey] ?? "#8b5cf6");
  const offset = gaugeStrokeOffset(service.performancePct);
  const circumference = (2 * Math.PI * 16).toFixed(2);

  return (
    <Link
      href={service.href}
      className="command-center__agent-perf-card command-center__glass pg-focus-premium"
    >
      <div className="command-center__agent-perf-top">
        <div className="command-center__agent-perf-id">
          <CcPeerIcon serviceKey={service.serviceKey} large />
          <span className="command-center__agent-perf-name">{service.label}</span>
        </div>
        <div className="command-center__gauge" aria-label={`${service.performancePct}% performance`}>
          <svg viewBox="0 0 38 38" aria-hidden>
            <circle className="command-center__gauge-track" cx="19" cy="19" r="16" />
            <circle
              className={`command-center__gauge-fill command-center__gauge-fill--${service.serviceKey}`}
              cx="19"
              cy="19"
              r="16"
              strokeDasharray={circumference}
              strokeDashoffset={offset.toFixed(2)}
            />
          </svg>
          <span className="command-center__gauge-val">{service.performancePct}%</span>
        </div>
      </div>
      <div className="command-center__agent-perf-bottom">
        <p className="command-center__agent-perf-tasks">
          <b>{service.tasksThisWeek}</b> tasks this week
        </p>
        <CcMiniSparkline values={service.sparkValues} color={color} width={54} height={20} />
      </div>
    </Link>
  );
}
