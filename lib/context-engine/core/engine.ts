import type { SupabaseClient } from "@supabase/supabase-js";
import { assembleContextPackage } from "../assembly/context-package";
import { serializeContextBundle } from "../assembly/serialize";
import { getLayerTtl } from "../cache/ttl";
import { defaultContextCache, type MemoryContextCache } from "../cache/memory-store";
import { BUILD_CONTEXT_LAZY_LAYERS, defaultLoaders } from "../loaders";
import type { LoaderContext } from "../loaders/base";
import {
  defaultPeerTypeRegistry,
  type PeerTypeRegistry,
} from "../peer-types/registry";
import {
  defaultScopeResolver,
  type ScopeResolver,
} from "../scope/scope-resolver";
import { resolveScope, validateScope } from "../scope/resolve-scope";
import type {
  BuildContextRequest,
  ContextBundle,
  ContextLayerKey,
  PromptPackage,
} from "../types";
import type { ContextPackage } from "@/lib/intelligence";
import type { Database } from "@/lib/supabase/database.types";
import { ContextBuilder, defaultContextBuilder } from "./builder";
import { LoaderRegistry } from "./loader-registry";
import {
  getDefaultEagerLayers,
  getDefaultLazyLayers,
} from "../assembly/compose-context";

export type BuildContextOptions = {
  supabase?: SupabaseClient<Database>;
};

export type ContextEngineOptions = {
  loaderRegistry?: LoaderRegistry;
  peerTypeRegistry?: PeerTypeRegistry;
  builder?: ContextBuilder;
  cache?: MemoryContextCache;
  scopeResolver?: ScopeResolver;
};

const COMMUNICATION_ROLES = new Set(["Sales", "Marketing", "Support"]);

export class ContextEngine {
  private readonly loaderRegistry: LoaderRegistry;
  private readonly peerTypeRegistry: PeerTypeRegistry;
  private readonly builder: ContextBuilder;
  private readonly cache: MemoryContextCache;
  private readonly scopeResolver: ScopeResolver;

  constructor(options: ContextEngineOptions = {}) {
    this.loaderRegistry = options.loaderRegistry ?? new LoaderRegistry();
    this.peerTypeRegistry = options.peerTypeRegistry ?? defaultPeerTypeRegistry;
    this.builder = options.builder ?? defaultContextBuilder;
    this.cache = options.cache ?? defaultContextCache;
    this.scopeResolver = options.scopeResolver ?? defaultScopeResolver;

    if (!options.loaderRegistry) {
      this.loaderRegistry.registerMany(defaultLoaders);
      this.loaderRegistry.registerMany(this.peerTypeRegistry.allLoaders());
    }
  }

  /**
   * Single entry point for AI context retrieval.
   * Loads eager layers plus intelligence layers (Company DNA, Business Brain,
   * Marketing Understanding, peer-type). Optional stub layers (knowledge, memory,
   * tools) are excluded from the load plan — they are not required for current
   * Marketing / Sales / Support capabilities.
   */
  async buildContext(
    request: BuildContextRequest,
    options: BuildContextOptions = {}
  ): Promise<ContextPackage> {
    const cacheHits: string[] = [];
    let bundle = await this.build(
      {
        ...request,
        lazyLayers: request.lazyLayers ?? [...BUILD_CONTEXT_LAZY_LAYERS],
      },
      options
    );

    for (const layerKey of BUILD_CONTEXT_LAZY_LAYERS) {
      if (bundle.layers[layerKey]) continue;
      bundle = await this.buildLazy(bundle, layerKey, options, request.taskHint);
    }

    return assembleContextPackage(bundle, {
      taskHint: request.taskHint,
      cacheHits,
    });
  }

  async build(
    request: BuildContextRequest,
    options: BuildContextOptions = {}
  ): Promise<ContextBundle> {
    const scope = options.supabase
      ? await this.scopeResolver.resolve(options.supabase, request)
      : resolveScope(request);
    validateScope(scope);

    scope.peer.role = this.peerTypeRegistry.get(scope.peer.role).role;

    const eagerLayers = request.eagerLayers ?? getDefaultEagerLayers();
    const lazyLayers = request.lazyLayers ?? getDefaultLazyLayers();

    if (COMMUNICATION_ROLES.has(scope.peer.role) && !eagerLayers.includes("company-dna")) {
      eagerLayers.push("company-dna");
    }

    const loaderContext: LoaderContext = {
      scope,
      taskHint: request.taskHint,
      supabase: options.supabase,
    };

    const slices = await Promise.all(
      eagerLayers.map((layerKey) => this.loadLayer(layerKey, loaderContext))
    );

    return this.builder.compose(scope, slices, lazyLayers);
  }

  async buildLazy(
    bundle: ContextBundle,
    layerKey: ContextLayerKey,
    options: BuildContextOptions = {},
    taskHint?: string
  ): Promise<ContextBundle> {
    if (bundle.layers[layerKey]) {
      return bundle;
    }

    const loaderContext: LoaderContext = {
      scope: bundle.scope,
      taskHint,
      supabase: options.supabase,
    };

    const slice = await this.loadLayer(layerKey, loaderContext);
    return this.builder.merge(bundle, slice);
  }

  toPromptPackage(bundle: ContextBundle): PromptPackage {
    return serializeContextBundle(bundle);
  }

  private async loadLayer(layerKey: ContextLayerKey, ctx: LoaderContext) {
    const cacheKey = this.cache.buildKey({
      organizationId: ctx.scope.organization.organizationId,
      peerId: ctx.scope.peer.peerId,
      layerKey,
    });

    const cached = this.cache.get<Awaited<ReturnType<ContextBuilder["runLoader"]>>>(cacheKey);
    if (cached) {
      return cached;
    }

    const loader = this.loaderRegistry.get(layerKey);
    const slice = await this.builder.runLoader(loader, ctx);

    const isUnavailableIntelligenceSlice =
      (layerKey === "business-brain" ||
        layerKey === "company-dna" ||
        layerKey === "marketing-understanding" ||
        layerKey === "brand-brain") &&
      typeof slice.data === "object" &&
      slice.data !== null &&
      "available" in slice.data &&
      (slice.data as { available: boolean }).available === false;

    if (!isUnavailableIntelligenceSlice) {
      this.cache.set(cacheKey, slice, loader.ttlMs ?? getLayerTtl(layerKey));
    }

    return slice;
  }
}

export const defaultContextEngine = new ContextEngine();
