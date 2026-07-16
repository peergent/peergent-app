export default function PeerDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-4 w-32 rounded bg-white/10" />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-white/10" />
            <div className="h-4 w-36 rounded bg-white/10" />
          </div>
        </div>
        <div className="h-10 w-24 rounded-xl bg-white/10" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="h-40 rounded-2xl bg-white/10" />
          <div className="h-32 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
        </div>
        <div className="space-y-5">
          <div className="h-36 rounded-2xl bg-white/10" />
          <div className="h-44 rounded-2xl bg-white/10" />
          <div className="h-32 rounded-2xl bg-white/10" />
        </div>
      </div>

      <div className="h-48 rounded-2xl bg-white/10" />
      <div className="h-56 rounded-2xl bg-white/10" />
      <div className="h-40 rounded-2xl bg-white/10" />
      <div className="h-44 rounded-2xl bg-white/10" />
    </div>
  );
}
