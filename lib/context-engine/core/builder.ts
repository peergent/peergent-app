import { prioritizeContext } from "../assembly/prioritize";
import { composeContext, mergeLayer } from "../assembly/compose-context";
import type { ContextBundle, ContextLayerKey, ContextScope } from "../types";
import type { ContextSliceResult, ContextLoader, LoaderContext } from "../loaders/base";

export class ContextBuilder {
  compose(
    scope: ContextScope,
    slices: ContextSliceResult<unknown>[],
    pendingLazyLayers: ContextLayerKey[]
  ): ContextBundle {
    const layers: ContextBundle["layers"] = {};

    for (const slice of slices) {
      const layerKey = slice.key as ContextLayerKey;
      layers[layerKey] = {
        key: slice.key,
        data: slice.data,
        sources: slice.sources,
        priority: slice.priority,
        loadMode: slice.loadMode,
      };
    }

    const bundle = composeContext(scope, layers, {
      pendingLazyLayers,
      traceId: scope.sessionId,
    });

    return prioritizeContext(bundle);
  }

  merge(bundle: ContextBundle, slice: ContextSliceResult<unknown>): ContextBundle {
    const prioritized = prioritizeContext(
      mergeLayer(bundle, slice.key as ContextLayerKey, {
        key: slice.key,
        data: slice.data,
        sources: slice.sources,
        priority: slice.priority,
        loadMode: slice.loadMode,
      })
    );

    return prioritized;
  }

  async runLoader(
    loader: ContextLoader<unknown>,
    ctx: LoaderContext
  ): Promise<ContextSliceResult<unknown>> {
    return loader.load(ctx);
  }
}

export const defaultContextBuilder = new ContextBuilder();
