export default function PeerDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-7">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-7 w-48 rounded bg-white/10" />
            <div className="h-4 w-36 rounded bg-white/10" />
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <div className="h-64 rounded-[24px] bg-white/[0.04]" />
          <div className="h-48 rounded-[24px] bg-white/[0.04]" />
          <div className="h-36 rounded-[24px] bg-white/[0.04]" />
        </div>
        <div className="space-y-7">
          <div className="h-24 rounded-[24px] bg-white/[0.04]" />
          <div className="h-36 rounded-[24px] bg-white/[0.04]" />
          <div className="h-32 rounded-[24px] bg-white/[0.04]" />
          <div className="h-28 rounded-[24px] bg-white/[0.04]" />
          <div className="h-32 rounded-[24px] bg-white/[0.04]" />
          <div className="h-52 rounded-[24px] bg-white/[0.04]" />
          <div className="h-56 rounded-[24px] bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
