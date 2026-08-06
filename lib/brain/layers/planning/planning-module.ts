/** Planning module entry — re-exports layer orchestration. Sprint 11.0. */
export {
  PlanningLayer,
  createPlanningLayer,
  collectPlanningGraph,
  planFromBrainInputs,
  type PlanningLayerInput,
  type PlanningLayerResult,
} from "./planning-layer";

export { PLANNING_MODULE_SPECS } from "./modules/specs";
