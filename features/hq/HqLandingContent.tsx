"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { HqLandingViewModel } from "@/lib/hq/build-hq-view-model";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import ExecutiveSummary from "./components/ExecutiveSummary";
import HqGreeting from "./components/HqGreeting";
import ManagerHub from "./components/ManagerHub";
import PeerNetwork from "./components/PeerNetwork";
import ServiceGrid from "./components/ServiceGrid";

export type HqLandingContentProps = {
  viewModel: HqLandingViewModel;
};

export default function HqLandingContent({ viewModel }: HqLandingContentProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const serviceRefs = useRef<Map<HqServiceKey, HTMLAnchorElement>>(new Map());

  const serviceKeys = useMemo(
    () => viewModel.services.map((service) => service.serviceKey),
    [viewModel.services]
  );

  const registerCardRef = useCallback((serviceKey: HqServiceKey, node: HTMLAnchorElement | null) => {
    if (node) {
      serviceRefs.current.set(serviceKey, node);
      return;
    }

    serviceRefs.current.delete(serviceKey);
  }, []);

  useEffect(() => {
    const visibleKeys = new Set(serviceKeys);

    for (const serviceKey of serviceRefs.current.keys()) {
      if (!visibleKeys.has(serviceKey)) {
        serviceRefs.current.delete(serviceKey);
      }
    }
  }, [serviceKeys]);

  const gridClassName =
    viewModel.gridColumns > 0
      ? `hq-landing__peer-grid hq-landing__peer-grid--cols-${viewModel.gridColumns}`
      : "hq-landing__peer-grid";

  const hasServices = viewModel.services.length > 0;

  return (
    <div className="hq-landing__page">
      <HqGreeting viewModel={viewModel} />

      <div className="hq-landing__canvas-wrap" ref={canvasRef}>
        {hasServices && (
          <PeerNetwork
            canvasRef={canvasRef}
            hubRef={hubRef}
            serviceKeys={serviceKeys}
            serviceRefs={serviceRefs}
          />
        )}

        <div className="hq-landing__hub-row">
          <ManagerHub hubRef={hubRef} />
        </div>

        {hasServices ? (
          <ServiceGrid
            services={viewModel.services}
            gridClassName={gridClassName}
            registerCardRef={registerCardRef}
          />
        ) : (
          <div className="hq-landing__empty-peers" role="status">
            <p className="hq-landing__empty-peers-title">No services configured yet</p>
            <p className="hq-landing__empty-peers-body">
              Add AI colleagues to your workforce to see your departments connected here.
            </p>
          </div>
        )}
      </div>

      <ExecutiveSummary summary={viewModel.executive} />
    </div>
  );
}
