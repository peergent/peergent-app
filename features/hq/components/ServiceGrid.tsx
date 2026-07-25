"use client";

import { useMemo } from "react";
import type { HqServiceCard } from "@/lib/hq/build-hq-view-model";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import ServiceCard from "./ServiceCard";

export type ServiceGridProps = {
  services: HqServiceCard[];
  gridClassName: string;
  registerCardRef: (serviceKey: HqServiceKey, node: HTMLAnchorElement | null) => void;
};

export default function ServiceGrid({
  services,
  gridClassName,
  registerCardRef,
}: ServiceGridProps) {
  const refCallbacks = useMemo(() => {
    const callbacks = new Map<string, (node: HTMLAnchorElement | null) => void>();

    for (const service of services) {
      callbacks.set(service.serviceKey, (node) => registerCardRef(service.serviceKey, node));
    }

    return callbacks;
  }, [services, registerCardRef]);

  return (
    <div className={gridClassName}>
      {services.map((service, index) => (
        <ServiceCard
          key={service.serviceKey}
          service={service}
          index={index}
          cardRef={refCallbacks.get(service.serviceKey)!}
        />
      ))}
    </div>
  );
}
