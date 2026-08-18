"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const projectionRef = useRef<CampaignRuntimeProjection | null>(null);

  const applyRuntimeProjection = useCallback((next: CampaignRuntimeProjection) => {
    projectionRef.current = next;
    setProjection(next);
  }, []);

  const refreshRuntimeProjection = useCallback(async () => {
    if (input.isDemo || input.enabled === false) {
      setProjection(null);
      projectionRef.current = null;
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await loadCampaignRuntimeProjectionAction({
        peerId: input.peerId,
        projectId: input.projectId,
        expectedVersion: projectionRef.current?.durableVersion,
      });
      if (!result.ok) {
        setError(result.error);
        setProjection(null);
        projectionRef.current = null;
        return null;
      }
      if (result.projection) {
        projectionRef.current = result.projection;
        setProjection(result.projection);
      } else {
        setProjection(null);
        projectionRef.current = null;
      }
      return result.projection;
    } catch {
      setError("load_failed");
      setProjection(null);
      projectionRef.current = null;
      return null;
    } finally {
      setLoading(false);
    }
  }, [input.enabled, input.isDemo, input.peerId, input.projectId]);

  useEffect(() => {
    void refreshRuntimeProjection();
  }, [refreshRuntimeProjection]);

  return {
    projection,
    loading,
    error,
    refresh: refreshRuntimeProjection,
    refreshRuntimeProjection,
    applyRuntimeProjection,
  };
}
