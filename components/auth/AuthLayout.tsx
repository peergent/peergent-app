import Link from "next/link";
import Image from "next/image";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[var(--pg-bg)] text-[var(--pg-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="auth-layout-glow absolute left-1/2 top-[10%] h-[480px] w-[min(720px,90vw)] -translate-x-1/2 rounded-full blur-2xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 py-10 md:px-6">
        <Link
          href="/"
          className="pg-focus-premium inline-flex items-center gap-3 self-start"
        >
          <Image
            src="/images/logo.png"
            alt="Peergent"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-lg font-semibold text-[var(--pg-text)]">Peergent</span>
        </Link>

        <div className="my-auto w-full py-10">
          <div className="mb-8">
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--pg-text)]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pg-text-muted)]">
              {description}
            </p>
          </div>

          <div className="pg-section-panel !rounded-[24px] !p-6 md:!p-7">{children}</div>

          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
