import Link from "next/link";
import Image from "next/image";
import ButtonLink from "@/components/ui/ButtonLink";

export default function MarketingNav() {
  return (
    <header className="relative z-10 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="pg-focus-premium inline-flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Peergent"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="text-lg font-semibold text-white">Peergent</p>
            <p className="text-xs text-slate-500">AI Workforce</p>
          </div>
        </Link>

        <nav className="flex items-center gap-3 md:gap-4">
          <Link
            href="/login"
            className="pg-focus-premium rounded-[14px] px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Login
          </Link>
          <ButtonLink href="/signup" size="sm">
            Start Free
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
