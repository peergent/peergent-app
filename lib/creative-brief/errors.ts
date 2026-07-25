/** Typed errors for Creative Brief assembly — no raw dependency payloads. */

export class CreativeBriefAssemblyError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CreativeBriefAssemblyError";
    this.code = code;
  }
}

export class CreativeBriefBlockedDecisionError extends CreativeBriefAssemblyError {
  constructor(reasons: readonly string[]) {
    super(
      "CREATIVE_BRIEF_BLOCKED_DECISION",
      `Marketing decision is blocked: ${reasons.join("; ") || "unknown"}`
    );
    this.name = "CreativeBriefBlockedDecisionError";
  }
}

export class CreativeBriefManualOnlyDecisionError extends CreativeBriefAssemblyError {
  constructor() {
    super(
      "CREATIVE_BRIEF_MANUAL_ONLY",
      "Marketing decision requires manual-only execution — creative brief assembly is not allowed."
    );
    this.name = "CreativeBriefManualOnlyDecisionError";
  }
}

export class CreativeBriefGenerationNotAllowedError extends CreativeBriefAssemblyError {
  constructor() {
    super(
      "CREATIVE_BRIEF_GENERATION_NOT_ALLOWED",
      "Marketing decision does not allow creative generation under current restrictions."
    );
    this.name = "CreativeBriefGenerationNotAllowedError";
  }
}

export class CreativeBriefNoSelectableChannelError extends CreativeBriefAssemblyError {
  constructor() {
    super(
      "CREATIVE_BRIEF_NO_CHANNEL",
      "No permitted channel recommendation available for creative brief assembly."
    );
    this.name = "CreativeBriefNoSelectableChannelError";
  }
}

export class CreativeBriefNoSelectableContentTypeError extends CreativeBriefAssemblyError {
  constructor() {
    super(
      "CREATIVE_BRIEF_NO_CONTENT_TYPE",
      "No permitted content type recommendation available for creative brief assembly."
    );
    this.name = "CreativeBriefNoSelectableContentTypeError";
  }
}

export class CreativeBriefRequestedSelectionBlockedError extends CreativeBriefAssemblyError {
  constructor(field: "channel" | "contentType", id: string) {
    super(
      "CREATIVE_BRIEF_REQUESTED_BLOCKED",
      `Requested ${field} "${id}" is blocked by marketing decision policy.`
    );
    this.name = "CreativeBriefRequestedSelectionBlockedError";
  }
}
