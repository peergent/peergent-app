import { describe, expect, it, vi } from "vitest";
import { createBrainRepositoriesForServer } from "../repository-factory-server";
import {
  PersistenceConfigurationError,
  PersistenceInfrastructureError,
} from "../server/persistence-config";
import { getLayerRepositories, resetConfiguredLayerRepositories } from "../layer-repository-factory";

describe("PX-48.1 production server wiring", () => {
  it("fails closed in production when supabase is missing for live Brain execution", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BRAIN_PERSISTENCE_MODE", "supabase");

    expect(() =>
      createBrainRepositoriesForServer({ environment: "live", peerId: "emma" })
    ).toThrow(PersistenceInfrastructureError);

    vi.unstubAllEnvs();
  });

  it("fails closed when layer repositories accessed uninitialized in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BRAIN_PERSISTENCE_MODE", "supabase");
    resetConfiguredLayerRepositories();

    expect(() => getLayerRepositories()).toThrow(PersistenceConfigurationError);

    vi.unstubAllEnvs();
    resetConfiguredLayerRepositories();
  });

  it("allows local live execution without supabase when mode is not supabase", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BRAIN_PERSISTENCE_MODE", "persistent_in_memory");

    const bundle = createBrainRepositoriesForServer({ environment: "live", peerId: "emma" });
    expect(bundle.storageMode).toBe("persistent_in_memory");

    vi.unstubAllEnvs();
  });
});
