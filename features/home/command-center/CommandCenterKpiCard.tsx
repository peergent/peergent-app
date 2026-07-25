import type { CcMetricCard } from "@/lib/home/build-command-center-view-model";
import { CcMetricSparkline } from "./components/CcMetricSparkline";

const SPARK_COLORS: Record<CcMetricCard["sparkColor"], string> = {
  default: "#8b5cf6",
  cyan: "#22d3ee",
  amber: "#f5b754",
};

const MUTED_SPARK_COLOR = "rgba(255, 255, 255, 0.22)";

export function CommandCenterKpiCard({ metric }: { metric: CcMetricCard }) {
  const sparkColor = metric.sparkMuted ? MUTED_SPARK_COLOR : SPARK_COLORS[metric.sparkColor];
  const deltaClass =
    metric.deltaTone === "up"
      ? "command-center__metric-delta--up"
      : "command-center__metric-delta--neutral";

  return (
    <article className="command-center__metric-card command-center__glass">
      <div className="command-center__metric-top">
        <span className="command-center__metric-label">{metric.label}</span>
        <span className={`command-center__metric-delta ${deltaClass}`}>{metric.deltaLabel}</span>
      </div>
      <p className="command-center__metric-value">{metric.value}</p>
      <CcMetricSparkline
        values={metric.sparkValues}
        color={sparkColor}
        width={120}
        height={30}
        muted={metric.sparkMuted}
      />
    </article>
  );
}
