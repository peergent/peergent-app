"use client";

export type NewsletterPreviewProps = {
  subject: string;
  body: string;
  preheader?: string;
};

export default function NewsletterPreview({ subject, body, preheader }: NewsletterPreviewProps) {
  return (
    <div className="emma-preview emma-preview--newsletter" aria-label="Newsletter preview">
      <div className="emma-preview--newsletter__chrome">
        <span className="emma-preview--newsletter__dot" />
        <span className="emma-preview--newsletter__dot" />
        <span className="emma-preview--newsletter__dot" />
      </div>
      <div className="emma-preview--newsletter__inbox">
        <p className="emma-preview--newsletter__from">From: Emma · Marketing</p>
        <h3 className="emma-preview--newsletter__subject">{subject}</h3>
        {preheader && <p className="emma-preview--newsletter__preheader">{preheader}</p>}
      </div>
      <article className="emma-preview--newsletter__body">
        {body.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      <footer className="emma-preview--newsletter__footer">
        <span className="emma-preview--newsletter__cta">Read more →</span>
      </footer>
    </div>
  );
}
