import { notFound } from "next/navigation";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (!isDevPlaygroundEnabled()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="border-b border-white/10 bg-[#070b18]/80 px-5 py-3">
        <p className="text-xs text-slate-500">
          Local development only · not linked from production UI
        </p>
      </div>
      <main className="px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
