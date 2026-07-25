export const APPROVAL_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const APPROVAL_UPLOAD_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
] as const;

export type MediaUploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateApprovalUpload(file: File): MediaUploadValidationResult {
  if (!APPROVAL_UPLOAD_ACCEPT.includes(file.type as (typeof APPROVAL_UPLOAD_ACCEPT)[number])) {
    return {
      ok: false,
      error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, or MP4.",
    };
  }
  if (file.size > APPROVAL_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      error: "File is too large. Maximum size is 10 MB.",
    };
  }
  return { ok: true };
}
