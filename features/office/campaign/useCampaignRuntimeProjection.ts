"use client";

import { useCallback, useEffect, useState } from "react";
import type { CampaignRuntimeProjection } from "@/lib/office/campaign/campaign-runtime-projection";
import { loadCampaignRuntimeProjectionAction } from "@/lib/office/campaign/load-campaign-runtime-projection-action";

export function useCampaignRuntimeProjection(input: {
  peerId: string;
  projectId: string;
  isDemo: boolean;
  enabled?: boolean;
}) {
  const [projection, setProjection] = useState<CampaignRuntimeProjection | null>(null);
  const [loading, setLoading] = useState(!input.isDemo);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (input.isDemo || input.enabled === false) {
      setProjection(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await loadCampaignRuntimeProjectionAction({
        peerId: input.peerId,
        projectId: input.projectId,
      });
      if (!result.ok) {
        setError(result.error);
        setProjection(null);
        return null;
      }
      setProjection(result.projection);
      return result.projection;
    } catch {
      setError("load_failed");
      setProjection(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [input.enabled, input.isDemo, input.peerId, input.projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    projection,
    loading,
    error,
    refresh,
  };
}
