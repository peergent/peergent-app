"use client";

export type LandingPagePreviewProps = {
  headline: string;
  body: string;
  callToAction?: string;
};

export default function LandingPagePreview({
  headline,
  body,
  callToAction,
}: LandingPagePreviewProps) {
  return (
    <div className="emma-preview emma-preview--landing" aria-label="Landing page preview">
      <header className="emma-preview--landing__nav">
        <span className="emma-preview--landing__logo">Brand</span>
        <nav className="emma-preview--landing__links" aria-hidden>
          <span>Product</span>
          <span>Pricing</span>
          <span>About</span>
        </nav>
      </header>
      <section className="emma-preview--landing__hero">
        <h1>{headline}</h1>
        <p>{body.split("\n\n")[0] ?? body}</p>
        {callToAction && (
          <button type="button" className="emma-preview--landing__cta">
            {callToAction}
          </button>
        )}
      </section>
      <section className="emma-preview--landing__features" aria-hidden>
        <div />
        <div />
        <div />
      </section>
    </div>
  );
}
