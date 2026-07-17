import { serializeContextBundle } from "../assembly/serialize";
import { getLayerTtl } from "../cache/ttl";
import { defaultContextCache, type MemoryContextCache } from "../cache/memory-store";
import { defaultLoaders } from "../loaders";
import type { LoaderContext } from "../loaders/base";
import {
  defaultPeerTypeRegistry,
  type PeerTypeRegistry,
} from "../peer-types/registry";
import { resolveScope, validateScope } from "../scope/resolve-scope";
import type {
  BuildContextRequest,
  ContextBundle,
  ContextLayerKey,
  PromptPackage,
} from "../types";
import { ContextBuilder, defaultContextBuilder } from "./builder";
import { LoaderRegistry } from "./loader-registry";
import {
  getDefaultEagerLayers,
  getDefaultLazyLayers,
} from "../assembly/compose-context";

export type ContextEngineOptions = {
  loaderRegistry?: LoaderRegistry;
  peerTypeRegistry?: PeerTypeRegistry;
  builder?: ContextBuilder;
  cache?: MemoryContextCache;
};

export class ContextEngine {
  private readonly loaderRegistry: LoaderRegistry;
  private readonly peerTypeRegistry: PeerTypeRegistry;
  private readonly builder: ContextBuilder;
  private readonly cache: MemoryContextCache;

  constructor(options: ContextEngineOptions = {}) {
    this.loaderRegistry = options.loaderRegistry ?? new LoaderRegistry();
    this.peerTypeRegistry = options.peerTypeRegistry ?? defaultPeerTypeRegistry;
    this.builder = options.builder ?? defaultContextBuilder;
    this.cache = options.cache ?? defaultContextCache;

    if (!options.loaderRegistry) {
      this.loaderRegistry.registerMany(defaultLoaders);
      this.loaderRegistry.registerMany(this.peerTypeRegistry.allLoaders());
    }
  }

  async build(request: BuildContextRequest): Promise<ContextBundle> {
    const scope = resolveScope(request);
    validateScope(scope);

    scope.peer.role = this.peerTypeRegistry.get(scope.peer.role).role;

    const eagerLayers = request.eagerLayers ?? getDefaultEagerLayers();
    const lazyLayers = request.lazyLayers ?? getDefaultLazyLayers();
    const loaderContext: LoaderContext = {
      scope,
      taskHint: request.taskHint,
    };

    const slices = await Promise.all(
      eagerLayers.map((layerKey) => this.loadLayer(layerKey, loaderContext))
    );

    return this.builder.compose(scope, slices, lazyLayers);
  }

  async buildLazy(
    bundle: ContextBundle,
    layerKey: ContextLayerKey
  ): Promise<ContextBundle> {
    if (bundle.layers[layerKey]) {
      return bundle;
    }

    const loaderContext: LoaderContext = {
      scope: bundle.scope,
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
    this.cache.set(cacheKey, slice, loader.ttlMs ?? getLayerTtl(layerKey));
    return slice;
  }
}

export const defaultContextEngine = new ContextEngine();
