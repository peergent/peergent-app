"use client";

import type { ReactNode } from "react";
import PgVisionFormModal from "@/components/design-system/PgVisionFormModal";
import MwModal from "./MwModal";

export type MarketingVisionModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: number;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  closeAriaLabel?: string;
  presentation?: "default" | "v17";
  testId?: string;
};

/**
 * Routes v17/Office presentation to Vision v13 modals; legacy paths keep MwModal.
 */
export default function MarketingVisionModal({
  presentation = "default",
  ...props
}: MarketingVisionModalProps) {
  if (presentation === "v17") {
    return <PgVisionFormModal {...props} />;
  }

  return (
    <MwModal
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      subtitle={props.subtitle}
      maxWidth={props.maxWidth}
      closeOnEscape={props.closeOnEscape}
      closeOnOverlayClick={props.closeOnOverlayClick}
      closeAriaLabel={props.closeAriaLabel}
      variant="default"
    >
      {props.children}
    </MwModal>
  );
}
