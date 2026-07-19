export { organizationLoader } from "./organization-loader";
export { peerLoader, objectiveLoader } from "./peer-loader";
export { policyLoader, preferencesLoader } from "./preferences-loader";
export { knowledgeLoader } from "./knowledge-loader";
export {
  brainLoader,
  businessBrainLoader,
  memoryLoader,
  toolsLoader,
  telemetryLoader,
} from "./brain-loader";
export type { BrainSnapshot } from "./business-brain-loader";
export type { ContextLoader, LoaderContext, ContextSliceResult } from "./base";
export { createStubSource } from "./base";

import { brainLoader, memoryLoader, telemetryLoader, toolsLoader } from "./brain-loader";
import { knowledgeLoader } from "./knowledge-loader";
import { organizationLoader } from "./organization-loader";
import { objectiveLoader, peerLoader } from "./peer-loader";
import { policyLoader } from "./preferences-loader";
import type { ContextLoader } from "./base";

export const defaultLoaders: ContextLoader<unknown>[] = [
  peerLoader,
  organizationLoader,
  objectiveLoader,
  policyLoader,
  telemetryLoader,
  knowledgeLoader,
  memoryLoader,
  toolsLoader,
  brainLoader,
];
