"use client";

import { cn } from "@/lib/ui/cn";
import NeuralCircuitAnimation from "./NeuralCircuitAnimation";

export default function BackgroundIntelligence({ className }: { className?: string }) {
  return (
    <div className={cn("home-bg-intelligence pointer-events-none absolute inset-0", className)} aria-hidden>
      <div className="home-bg-intelligence-glow" />
      <div className="home-bg-intelligence-mesh opacity-40">
        <NeuralCircuitAnimation className="scale-150 blur-[2px]" />
      </div>
    </div>
  );
}
