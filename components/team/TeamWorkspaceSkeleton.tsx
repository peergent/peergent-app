function WorkspaceSkeleton() {
  return (
    <article className="animate-pulse overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-7">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-[var(--pg-radius-xl)] bg-white/10" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-6 h-4 w-full rounded bg-white/10" />
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.05] pt-5">
        <div className="h-10 rounded bg-white/10" />
        <div className="h-10 rounded bg-white/10" />
        <div className="h-10 rounded bg-white/10" />
      </div>
    </article>
  );
}

function ActivitySkeleton() {
  return (
    <div className="animate-pulse rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-5">
      <div className="h-3 w-16 rounded bg-white/10" />
      <div className="mt-4 space-y-4">
        <div className="h-12 rounded bg-white/[0.04]" />
        <div className="h-12 rounded bg-white/[0.04]" />
        <div className="h-12 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

export default function TeamWorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-36 rounded bg-white/10" />
        <div className="h-4 w-64 max-w-full rounded bg-white/10" />
      </div>
      <div className="animate-pulse flex gap-6 border-y border-white/[0.05] py-3">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-4 w-28 rounded bg-white/10" />
        <div className="h-4 w-20 rounded bg-white/10" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="order-1 lg:order-2">
          <ActivitySkeleton />
        </div>
        <div className="order-2 flex flex-col gap-5 lg:order-1">
          <WorkspaceSkeleton />
          <div className="h-36 animate-pulse rounded-[28px] border border-white/[0.06] bg-white/[0.02]" />
        </div>
      </div>
    </div>
  );
}
