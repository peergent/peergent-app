"use client";

import { ArrowRight } from "lucide-react";
import BrainCore from "@/components/website-intelligence/intelligence/BrainCore";
import { hireBtnPrimary, hireHeadline, hireSupport } from "@/lib/hire-team/hire-ui";
import { cn } from "@/lib/ui/cn";

type HireCreatingProps = {
  onRetry: () => void;
  failed: boolean;
  reducedMotion?: boolean;
};

export default function HireCreating({ onRetry, failed, reducedMotion }: HireCreatingProps) {
  if (failed) {
    return (
      <div className="flex flex-col items-center text-center">
        <BrainCore size="lg" className="h-12 w-12 opacity-80" />
        <h1 className={cn("mt-10", hireHeadline, "text-xl md:text-2xl")}>
          Your team needs one more moment.
        </h1>
        <p className={cn("mt-4", hireSupport)}>
          We couldn&apos;t finish setting up your AI team just yet.
        </p>
        <button type="button" onClick={onRetry} className={cn("mt-12", hireBtnPrimary)}>
          Try again
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <BrainCore
        size="lg"
        className={cn("h-12 w-12 opacity-80", !reducedMotion && "pg-breathe")}
      />
      <h1 className={cn("mt-10 text-xl font-medium text-white md:text-2xl")}>
        Welcoming your team…
      </h1>
      <p className={cn("mt-4", hireSupport)}>
        Sales Peer and Marketing Peer are joining your company.
      </p>
    </div>
  );
}
