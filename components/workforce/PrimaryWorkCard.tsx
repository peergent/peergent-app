"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Rocket,
  Sparkles,
  Target,
  ArrowRight,
} from "lucide-react";
import { PgButton } from "@/components/design-system";
import type { HandoffUrgency, HandoffWorkKind } from "@/lib/home/handoff-types";
import { cn } from "@/lib/ui/cn";
import type { PrimaryWorkCardProps } from "./types";

const KIND_ICONS = {
  strategy: Target,
  plan: Calendar,
  draft: FileText,
  publication: Rocket,
  context: Building2,
  onboarding: Sparkles,
  workspace: Briefcase,
} satisfies Record<HandoffWorkKind, typeof Target>;

function urgencyTone(urgency: HandoffUrgency): "urgent" | "blocked" | "active" | "calm" {
  if (urgency === "urgent") return "urgent";
  if (urgency === "blocked") return "blocked";
  if (urgency === "calm") return "calm";
  return "active";
}

/**
 * Primary work / agent-action surface for the executive briefing home.
 */
export default function PrimaryWorkCard({
  work,
  categoryLabel,
  urgency,
  peerRole,
  ctaLabel = "Open",
  secondaryCtaLabel,
  secondaryHref,
  sectionLabel = "Agent Action",
  statusCopy,
  className,
  onActivate,
}: PrimaryWorkCardProps) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const Icon = KIND_ICONS[work.kind] ?? Briefcase;
  const tone = urgencyTone(urgency);

  const status =
    work.contextLine ??
    (urgency === "urgent"
      ? statusCopy?.primaryStatusWaitingReview ?? "Waiting for your review"
      : urgency === "blocked"
        ? statusCopy?.primaryStatusNeededToContinue ?? "Needed to continue"
        : urgency === "calm"
          ? statusCopy?.primaryStatusInProgress ?? "In progress"
          : statusCopy?.primaryStatusReadyForReview ?? "Ready for your review");

  const activate = useCallback(() => {
    if (exiting) return;
    onActivate?.();
    setExiting(true);
    window.setTimeout(() => router.push(work.destination), 380);
  }, [exiting, onActivate, router, work.destination]);

  const meta: string[] = [];
  if (work.completedAtLabel) meta.push(work.completedAtLabel);
  if (categoryLabel) meta.push(categoryLabel);

  const description =
    work.contextLine && work.contextLine !== status
      ? work.contextLine
      : work.completedAtLabel
        ? (statusCopy?.completedBy(work.peerName) ?? `Completed by ${work.peerName}`)
        : null;

  return (
    <section className={cn("primary-work-card", className)} aria-label={sectionLabel}>
      <div className="primary-work-kicker">
        <span className={cn("primary-work-kicker-dot", `primary-work-kicker-dot-${tone}`)} aria-hidden />
        <p className={cn("primary-work-kicker-label", `primary-work-kicker-label-${tone}`)}>{sectionLabel}</p>
      </div>

      <div
        className={cn(
          "primary-work-surface",
          `primary-work-surface-${tone}`,
          exiting && "primary-work-surface-exiting"
        )}
      >
        <div className="primary-work-header">
          <div className={cn("primary-work-icon", `primary-work-icon-${tone}`)} aria-hidden>
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="primary-work-meta-row">
              <span className={cn("primary-work-status", `primary-work-status-${tone}`)}>{status}</span>
              <span className="primary-work-peer">
                {work.peerName}
                {peerRole ? ` · ${peerRole}` : ""}
              </span>
            </div>
            <h2 className="primary-work-title">{work.title}</h2>
          </div>
        </div>

        {description && <p className="primary-work-description">{description}</p>}

        {meta.length > 0 && (
          <div className="primary-work-tags">
            {meta.map((tag) => (
              <span key={tag} className="primary-work-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="primary-work-footer">
          <PgButton
            size="sm"
            className="home-primary-cta"
            rightIcon={<ArrowRight size={10} aria-hidden />}
            onClick={activate}
            aria-label={`${ctaLabel}: ${work.title}`}
          >
            {ctaLabel}
          </PgButton>
          {secondaryHref && secondaryCtaLabel && (
            <Link href={secondaryHref} className="primary-work-secondary-cta pg-focus-premium">
              {secondaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
