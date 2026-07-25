"use client";

import PgButton from "@/components/design-system/PgButton";
import ThinkingState from "@/components/ui/ThinkingState";
import DeliverableComplete from "@/components/peer-workspace/deliverables/DeliverableComplete";
import DeliverableContent from "@/components/peer-workspace/deliverables/DeliverableContent";
import DeliverableDocument from "@/components/peer-workspace/deliverables/DeliverableDocument";
import DeliverablePublishPreview from "@/components/peer-workspace/deliverables/DeliverablePublishPreview";
import type {
  DeliverableReviewContextAction,
  DeliverableViewModel,
  DetailSlideOverKind,
  PrimaryAction,
} from "@/lib/peer-experience";
import {
  resolveWorkPlaneState,
  type WorkPlaneState,
} from "@/lib/peer-experience/marketing/resolve-work-plane-state";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";
import { cn } from "@/lib/ui/cn";

export type PgWorkPlaneContentProps = {
  deliverable: DeliverableViewModel;
  primaryAction?: PrimaryAction | null;
  generating?: boolean;
  onPrimaryAction?: () => void;
  archiveLabel?: string;
  reviewContextActions?: DeliverableReviewContextAction[];
  onOpenInspector?: (kind: DetailSlideOverKind) => void;
  onOpenDetail?: (kind: DetailSlideOverKind) => void;
  className?: string;
};

function WorkPlaneInvitation({
  label,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  if (!onClick) return null;

  return (
    <div className="mt-10 border-t border-[var(--pg-color-border-subtle)]/60 pt-8">
      <PgButton
        variant="primary"
        size="lg"
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        className="max-w-full whitespace-normal text-left leading-snug"
      >
        {label}
      </PgButton>
    </div>
  );
}

function WorkPlaneEmpty({
  deliverable,
  invitation,
  onInvite,
  generating,
}: {
  deliverable: Extract<DeliverableViewModel, { kind: "empty" }>;
  invitation?: string;
  onInvite?: () => void;
  generating?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--pg-color-text-tertiary)]">
        {deliverable.title}
      </p>
      <h2 className="mt-3 max-w-lg text-2xl font-semibold leading-snug tracking-tight text-[var(--pg-color-text-primary)] md:text-[1.75rem]">
        {deliverable.message}
      </h2>
      {deliverable.detail && (
        <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--pg-color-text-secondary)]">
          {deliverable.detail}
        </p>
      )}
      {invitation && (
        <WorkPlaneInvitation
          label={invitation}
          disabled={generating}
          loading={generating}
          onClick={onInvite}
        />
      )}
    </div>
  );
}

function WorkPlaneWorking({
  deliverable,
}: {
  deliverable: Extract<DeliverableViewModel, { kind: "empty" }>;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--pg-color-text-tertiary)]">
        {deliverable.title}
      </p>
      <h2 className="mt-3 max-w-lg text-2xl font-semibold leading-snug text-[var(--pg-color-text-primary)] md:text-[1.75rem]">
        {deliverable.message}
      </h2>
      <div className="mt-8">
        <ThinkingState mode="thinking" label="Writing…" />
      </div>
    </div>
  );
}

function WorkPlaneDocument({
  deliverable,
  invitation,
  onInvite,
  generating,
  onOpenDetail,
}: {
  deliverable: Extract<DeliverableViewModel, { kind: "document" }>;
  invitation?: string;
  onInvite?: () => void;
  generating?: boolean;
  onOpenDetail?: (kind: DetailSlideOverKind) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="[&_h3]:text-[var(--pg-color-text-primary)] [&_p]:text-[var(--pg-color-text-secondary)] [&_dt]:text-[var(--pg-color-text-tertiary)] [&_dd]:text-[var(--pg-color-text-primary)] [&_.text-slate-600]:text-[var(--pg-color-text-tertiary)] [&_.text-white]:text-[var(--pg-color-text-primary)] [&_.text-violet-400]:text-[var(--pg-color-accent)]">
        <DeliverableDocument deliverable={deliverable} onOpenDetail={onOpenDetail} />
      </div>
      {invitation && (
        <WorkPlaneInvitation
          label={invitation}
          disabled={generating}
          loading={generating}
          onClick={onInvite}
        />
      )}
    </div>
  );
}

function WorkPlaneReview({
  deliverable,
  reviewContextActions,
  onOpenInspector,
}: {
  deliverable: Extract<DeliverableViewModel, { kind: "content" }>;
  reviewContextActions?: DeliverableReviewContextAction[];
  onOpenInspector?: (kind: DetailSlideOverKind) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <DeliverableContent
        deliverable={deliverable}
        contextActions={reviewContextActions}
        onOpenInspector={onOpenInspector}
      />
    </div>
  );
}

function WorkPlanePublication({
  deliverable,
  invitation,
  onInvite,
  generating,
}: {
  deliverable: Extract<DeliverableViewModel, { kind: "publish-preview" }>;
  invitation?: string;
  onInvite?: () => void;
  generating?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col [&_.text-slate-300]:text-[var(--pg-color-text-secondary)] [&_.text-slate-500]:text-[var(--pg-color-text-tertiary)] [&_.text-white]:text-[var(--pg-color-text-primary)]">
      <DeliverablePublishPreview deliverable={deliverable} />
      {invitation && (
        <WorkPlaneInvitation
          label={invitation}
          disabled={generating}
          loading={generating}
          onClick={onInvite}
        />
      )}
    </div>
  );
}

function WorkPlaneCompletion({
  deliverable,
  invitation,
  onInvite,
  generating,
}: {
  deliverable: Extract<DeliverableViewModel, { kind: "complete" }>;
  invitation?: string;
  onInvite?: () => void;
  generating?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center [&_.text-slate-400]:text-[var(--pg-color-text-secondary)] [&_.text-slate-500]:text-[var(--pg-color-text-tertiary)] [&_.text-white]:text-[var(--pg-color-text-primary)]">
      <DeliverableComplete deliverable={deliverable} />
      {invitation && (
        <WorkPlaneInvitation
          label={invitation}
          disabled={generating}
          loading={generating}
          onClick={onInvite}
        />
      )}
    </div>
  );
}

export function resolveWorkPlaneStateFromDeliverable(
  deliverable: DeliverableViewModel
): WorkPlaneState {
  return resolveWorkPlaneState(deliverable);
}

export default function PgWorkPlaneContent({
  deliverable,
  primaryAction,
  generating = false,
  onPrimaryAction,
  archiveLabel,
  reviewContextActions,
  onOpenInspector,
  onOpenDetail,
  className,
}: PgWorkPlaneContentProps) {
  const state = resolveWorkPlaneState(deliverable);
  const showInvitation =
    primaryAction &&
    onPrimaryAction &&
    state !== "review" &&
    state !== "working" &&
    !archiveLabel;

  const invitation = showInvitation ? primaryAction.label : undefined;

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col pg-studio-artifact-settle", className)}
      data-work-plane-state={state}
    >
      {archiveLabel && (
        <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--pg-color-text-tertiary)]">
          {STUDIO_COPY.workPlane.archiveLabel} · {archiveLabel}
        </p>
      )}
      {state === "empty" && deliverable.kind === "empty" && (
        <WorkPlaneEmpty
          deliverable={deliverable}
          invitation={invitation}
          onInvite={onPrimaryAction}
          generating={generating}
        />
      )}
      {state === "working" && deliverable.kind === "empty" && (
        <WorkPlaneWorking deliverable={deliverable} />
      )}
      {state === "document" && deliverable.kind === "document" && (
        <WorkPlaneDocument
          deliverable={deliverable}
          invitation={invitation}
          onInvite={onPrimaryAction}
          generating={generating}
          onOpenDetail={onOpenDetail}
        />
      )}
      {state === "document" && deliverable.kind === "content" && (
        <div className="flex flex-1 flex-col">
          <DeliverableContent deliverable={deliverable} />
        </div>
      )}
      {state === "review" && deliverable.kind === "content" && (
        <WorkPlaneReview
          deliverable={deliverable}
          reviewContextActions={reviewContextActions}
          onOpenInspector={onOpenInspector}
        />
      )}
      {state === "publication" && deliverable.kind === "publish-preview" && (
        <WorkPlanePublication
          deliverable={deliverable}
          invitation={invitation}
          onInvite={onPrimaryAction}
          generating={generating}
        />
      )}
      {state === "completion" && deliverable.kind === "complete" && (
        <WorkPlaneCompletion
          deliverable={deliverable}
          invitation={invitation}
          onInvite={onPrimaryAction}
          generating={generating}
        />
      )}
    </div>
  );
}
