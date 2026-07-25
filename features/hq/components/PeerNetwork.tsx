"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import {
  arePathsEqual,
  buildConnectorPaths,
  type ConnectorPath,
} from "@/lib/hq/connector-paths";

export type PeerNetworkProps = {
  canvasRef: RefObject<HTMLDivElement | null>;
  hubRef: RefObject<HTMLDivElement | null>;
  serviceKeys: HqServiceKey[];
  serviceRefs: RefObject<Map<HqServiceKey, HTMLAnchorElement>>;
};

type Dimensions = {
  width: number;
  height: number;
};

function dimensionsEqual(left: Dimensions, right: Dimensions): boolean {
  return left.width === right.width && left.height === right.height;
}

export default function PeerNetwork({
  canvasRef,
  hubRef,
  serviceKeys,
  serviceRefs,
}: PeerNetworkProps) {
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const rafRef = useRef<number | null>(null);
  const cardObserversRef = useRef<ResizeObserver[]>([]);
  const serviceKeysKey = serviceKeys.join("|");

  const measurePaths = useCallback(() => {
    const container = canvasRef.current;
    const manager = hubRef.current;

    if (!container || !manager) {
      setPaths((current) => (current.length === 0 ? current : []));
      setDimensions((current) =>
        current.width === 0 && current.height === 0 ? current : { width: 0, height: 0 }
      );
      return;
    }

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) {
      return;
    }

    const managerRect = manager.getBoundingClientRect();
    const cardRects = new Map<string, { left: number; top: number; width: number }>();

    for (const serviceKey of serviceKeys) {
      const card = serviceRefs.current?.get(serviceKey);
      if (!card) continue;
      const cardRect = card.getBoundingClientRect();
      cardRects.set(serviceKey, {
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
      });
    }

    const nextPaths = buildConnectorPaths({
      peerIds: serviceKeys,
      containerRect,
      managerRect,
      cardRects,
    });

    const nextDimensions = {
      width: containerRect.width,
      height: containerRect.height,
    };

    setPaths((current) => (arePathsEqual(current, nextPaths) ? current : nextPaths));
    setDimensions((current) =>
      dimensionsEqual(current, nextDimensions) ? current : nextDimensions
    );
  }, [canvasRef, hubRef, serviceKeys, serviceRefs]);

  const scheduleMeasure = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      measurePaths();
      rafRef.current = null;
    });
  }, [measurePaths]);

  useLayoutEffect(() => {
    cardObserversRef.current.forEach((observer) => observer.disconnect());
    cardObserversRef.current = [];

    scheduleMeasure();

    const container = canvasRef.current;
    const manager = hubRef.current;
    if (!container) {
      return () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
    }

    const containerObserver = new ResizeObserver(scheduleMeasure);
    containerObserver.observe(container);
    cardObserversRef.current.push(containerObserver);

    if (manager) {
      const managerObserver = new ResizeObserver(scheduleMeasure);
      managerObserver.observe(manager);
      cardObserversRef.current.push(managerObserver);
    }

    for (const serviceKey of serviceKeys) {
      const card = serviceRefs.current?.get(serviceKey);
      if (!card) continue;
      const cardObserver = new ResizeObserver(scheduleMeasure);
      cardObserver.observe(card);
      cardObserversRef.current.push(cardObserver);
    }

    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(scheduleMeasure);
    }

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      cardObserversRef.current.forEach((observer) => observer.disconnect());
      cardObserversRef.current = [];
      containerObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, hubRef, serviceKeysKey, serviceRefs, scheduleMeasure]);

  if (dimensions.width <= 0 || paths.length === 0) {
    return (
      <svg
        className="hq-landing__connectors"
        aria-hidden="true"
        width={dimensions.width || undefined}
        height={dimensions.height || undefined}
      />
    );
  }

  return (
    <svg
      className="hq-landing__connectors"
      aria-hidden="true"
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
    >
      {paths.map((path) => (
        <g key={path.peerId}>
          <path className="hq-landing__wire" d={path.d} />
          <path className="hq-landing__wire-flow" d={path.d} />
        </g>
      ))}
    </svg>
  );
}
