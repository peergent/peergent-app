"use client";

export type GoogleAdPreviewProps = {
  headline: string;
  body: string;
  callToAction?: string;
};

export default function GoogleAdPreview({
  headline,
  body,
  callToAction,
}: GoogleAdPreviewProps) {
  return (
    <div className="emma-preview emma-preview--google-ad" aria-label="Google ad preview">
      <p className="emma-preview--google-ad__label">Ad · yoursite.com</p>
      <p className="emma-preview--google-ad__headline">{headline}</p>
      <p className="emma-preview--google-ad__body">{body.split("\n\n")[0] ?? body}</p>
      {callToAction && (
        <span className="emma-preview--google-ad__ext">{callToAction}</span>
      )}
    </div>
  );
}
