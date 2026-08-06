/** Planning module registry — outcome modules, not task modules. */

export type PlanningModuleSpec = {
  id: string;
  title: string;
  purpose: string;
};

export const PLANNING_MODULE_SPECS: readonly PlanningModuleSpec[] = [
  {
    id: "dependency_engine",
    title: "Dependency Engine",
    purpose: "Detect missing, circular, and parallel dependencies; compute critical path.",
  },
  {
    id: "readiness_engine",
    title: "Readiness Engine",
    purpose: "Evaluate execution readiness — never fabricate, always explain blockers.",
  },
  {
    id: "timeline_engine",
    title: "Timeline Intelligence",
    purpose: "Reason about timing intent — what creates value and learning first.",
  },
  {
    id: "risk_engine",
    title: "Risk Engine",
    purpose: "Proactive execution risks with mitigation, fallback, and review triggers.",
  },
  {
    id: "resource_planner",
    title: "Resource Planner",
    purpose: "Identify required assets, knowledge, customer input, and integrations.",
  },
  {
    id: "review_planner",
    title: "Review Planner",
    purpose: "Schedule future thinking moments for Performance Brain.",
  },
];
