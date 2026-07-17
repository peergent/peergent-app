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
    <div className="relative min-h-screen bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[12%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-violet-600/[0.06] blur-[120px]" />
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
          <span className="text-lg font-semibold text-white">Peergent</span>
        </Link>

        <div className="my-auto w-full py-10">
          <div className="mb-8">
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6 md:p-7">
            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
