export { organizationLoader } from "./organization-loader";
export { peerLoader, objectiveLoader } from "./peer-loader";
export { preferencesLoader } from "./preferences-loader";
export { knowledgeLoader } from "./knowledge-loader";
export {
  brainLoader,
  memoryLoader,
  toolsLoader,
  telemetryLoader,
} from "./brain-loader";
export type { ContextLoader, LoaderContext, ContextSliceResult } from "./base";
export { createStubSource } from "./base";

import { brainLoader, memoryLoader, telemetryLoader, toolsLoader } from "./brain-loader";
import { knowledgeLoader } from "./knowledge-loader";
import { organizationLoader } from "./organization-loader";
import { objectiveLoader, peerLoader } from "./peer-loader";
import { preferencesLoader } from "./preferences-loader";
import type { ContextLoader } from "./base";

export const defaultLoaders: ContextLoader<unknown>[] = [
  peerLoader,
  organizationLoader,
  objectiveLoader,
  preferencesLoader,
  telemetryLoader,
  knowledgeLoader,
  memoryLoader,
  toolsLoader,
  brainLoader,
];
