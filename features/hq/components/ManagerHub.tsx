"use client";

import type { Ref } from "react";
import BriefingNotification from "./BriefingNotification";
import { ManagerHubIcon } from "./hq-icons";

export type ManagerHubProps = {
  hubRef: Ref<HTMLDivElement>;
};

export default function ManagerHub({ hubRef }: ManagerHubProps) {
  return (
    <div className="hq-landing__hub-stage">
      <div className="hq-landing__hub-glow" aria-hidden />
      <BriefingNotification />
      <div className="hq-landing__hub-orb" ref={hubRef}>
        <div className="hq-landing__hub-orb-icon">
          <ManagerHubIcon />
        </div>
        <div className="hq-landing__hub-orb-name">Manager Agent</div>
        <div className="hq-landing__hub-orb-role">Orchestrator</div>
      </div>
    </div>
  );
}
