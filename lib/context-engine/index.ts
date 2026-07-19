export { ContextEngine, defaultContextEngine } from "./core/engine";
export type { BuildContextOptions, ContextEngineOptions } from "./core/engine";
export { ContextBuilder, defaultContextBuilder } from "./core/builder";
export { LoaderRegistry } from "./core/loader-registry";
export { PeerTypeRegistry, defaultPeerTypeRegistry } from "./peer-types/registry";
export { ScopeResolver, defaultScopeResolver } from "./scope/scope-resolver";
export { assembleContextPackage } from "./assembly/context-package";

export type {
  ActorScope,
  BuildContextRequest,
  ContextBundle,
  ContextBundleMeta,
  ContextCapabilities,
  ContextLayerKey,
  ContextScope,
  ContextSlice,
  LoadMode,
  OrganizationScope,
  OrganizationSlice,
  PeerIdentitySlice,
  PeerRole,
  PeerScope,
  PromptPackage,
  PromptSection,
  SourceFreshness,
  SourceRef,
  SourceType,
} from "./types";

export type { ContextPackage } from "@/lib/intelligence";

export { serializeContextBundle } from "./assembly/serialize";
export { formatContextAsMarkdown } from "./adapters/llm/formatters/markdown-formatter";
export { defaultToolRegistry, ToolRegistry } from "./adapters/tools/registry";
export {
  assessmentToBrainSnapshot,
  emptyBrainSnapshot,
  toBrainSnapshot,
} from "./adapters/brain/business-brain-adapter";
export type { BrainSnapshot } from "./adapters/brain/business-brain-adapter";
export { defaultLoaders, BUILD_CONTEXT_LAZY_LAYERS } from "./loaders";
export { resolveScope, validateScope } from "./scope/resolve-scope";
