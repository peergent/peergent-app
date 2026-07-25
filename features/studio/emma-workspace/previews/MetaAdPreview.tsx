"use client";

export type MetaAdPreviewProps = {
  headline: string;
  body: string;
  callToAction?: string;
};

export default function MetaAdPreview({ headline, body, callToAction }: MetaAdPreviewProps) {
  return (
    <div className="emma-preview emma-preview--meta-ad" aria-label="Meta ad preview">
      <div className="emma-preview--meta-ad__media" />
      <div className="emma-preview--meta-ad__content">
        <p className="emma-preview--meta-ad__brand">Your brand</p>
        <p className="emma-preview--meta-ad__headline">{headline}</p>
        <p className="emma-preview--meta-ad__body">{body.split("\n\n")[0] ?? body}</p>
        {callToAction && (
          <span className="emma-preview--meta-ad__cta">{callToAction}</span>
        )}
      </div>
    </div>
  );
}
