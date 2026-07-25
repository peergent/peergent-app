export function CcBrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ccLogoGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path d="M10 6 h9 a9.5 9.5 0 0 1 0 19 h-5 v9 h-4 z" fill="url(#ccLogoGrad)" />
    </svg>
  );
}
