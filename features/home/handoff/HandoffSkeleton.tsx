export default function HandoffSkeleton() {
  return (
    <div className="space-y-7" aria-hidden>
      <div className="space-y-4">
        <div className="h-3 w-40 rounded bg-white/[0.06]" />
        <div className="h-12 w-[min(100%,560px)] rounded bg-white/[0.05]" />
        <div className="h-4 w-[min(100%,480px)] rounded bg-white/[0.04]" />
      </div>
      <div className="h-[180px] w-full rounded-[14px] bg-white/[0.04]" />
      <div className="h-[120px] w-full rounded-[14px] bg-white/[0.03]" />
      <div className="grid gap-7 lg:grid-cols-[200px_1fr]">
        <div className="h-[220px] rounded-[14px] bg-white/[0.03]" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-[120px] rounded-[14px] bg-white/[0.03]" />
          <div className="h-[120px] rounded-[14px] bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}
