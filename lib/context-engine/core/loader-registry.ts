import type { ContextLayerKey } from "../types";
import type { ContextLoader } from "../loaders/base";
import { UnknownLayerError } from "./errors";

export class LoaderRegistry {
  private readonly loaders = new Map<string, ContextLoader<unknown>>();

  register(loader: ContextLoader<unknown>) {
    this.loaders.set(String(loader.layerKey), loader);
    this.loaders.set(String(loader.key), loader);
  }

  registerMany(loaders: ContextLoader<unknown>[]) {
    loaders.forEach((loader) => this.register(loader));
  }

  get(layerKey: ContextLayerKey | string): ContextLoader<unknown> {
    const loader = this.loaders.get(String(layerKey));
    if (!loader) {
      throw new UnknownLayerError(String(layerKey));
    }
    return loader;
  }

  list(): ContextLoader<unknown>[] {
    const unique = new Map<string, ContextLoader<unknown>>();
    for (const loader of this.loaders.values()) {
      unique.set(String(loader.layerKey), loader);
    }
    return [...unique.values()];
  }

  byMode(mode: "eager" | "lazy") {
    return this.list().filter((loader) => loader.loadMode === mode);
  }
}
