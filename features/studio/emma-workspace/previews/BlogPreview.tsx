"use client";

export type BlogPreviewProps = {
  headline: string;
  body: string;
};

export default function BlogPreview({ headline, body }: BlogPreviewProps) {
  const excerpt = body.split("\n\n")[0] ?? body;

  return (
    <article className="emma-preview emma-preview--blog" aria-label="Blog preview">
      <header className="emma-preview--blog__hero">
        <span className="emma-preview--blog__tag">Blog</span>
        <h1>{headline}</h1>
        <p className="emma-preview--blog__meta">5 min read · Emma</p>
      </header>
      <div className="emma-preview--blog__body">
        <p>{excerpt}</p>
      </div>
    </article>
  );
}
