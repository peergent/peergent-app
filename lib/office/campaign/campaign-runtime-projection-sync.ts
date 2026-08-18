/**
 * PX-61 — server→client runtime projection sync payload after durable mutations.
 */

import type { EpisodeRunnerStopReason } from "@/lib/brain/project-runtime/episode-runner-stop-reasons";
import type { EpisodeStatus } from "@/lib/brain/project-runtime/types";
import type { ProjectLifecycleState } from "@/lib/brain/project-engine/types";
import type { CampaignRuntimeProjection } from "./campaign-runtime-projection";

/** Authoritative runtime snapshot returned after server-side continuation completes. */
export type CampaignRuntimeSyncPayload = {
  runtimeProjection: CampaignRuntimeProjection;
  episodeStatus: EpisodeStatus;
  lifecycleState: ProjectLifecycleState;
  durableVersion: number;
  stopReason: EpisodeRunnerStopReason | null;
  correlationId: string;
};
