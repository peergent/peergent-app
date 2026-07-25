function WorkspaceSkeleton() {
  return (
    <article className="pg-card-elevated animate-pulse p-7">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-[var(--pg-radius-xl)] pg-skeleton-block" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-16 rounded pg-skeleton-block" />
          <div className="h-5 w-32 rounded pg-skeleton-block" />
          <div className="h-4 w-24 rounded pg-skeleton-block" />
        </div>
      </div>
      <div className="mt-6 h-4 w-full rounded pg-skeleton-block" />
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--pg-divider-line)] pt-5">
        <div className="h-10 rounded pg-skeleton-block" />
        <div className="h-10 rounded pg-skeleton-block" />
        <div className="h-10 rounded pg-skeleton-block" />
      </div>
    </article>
  );
}

function ActivitySkeleton() {
  return (
    <div className="pg-panel-compact animate-pulse">
      <div className="h-3 w-16 rounded pg-skeleton-block" />
      <div className="mt-4 space-y-4">
        <div className="h-12 rounded pg-skeleton-subtle" />
        <div className="h-12 rounded pg-skeleton-subtle" />
        <div className="h-12 rounded pg-skeleton-subtle" />
      </div>
    </div>
  );
}

export default function TeamWorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-36 rounded pg-skeleton-block" />
        <div className="h-4 w-64 max-w-full rounded pg-skeleton-block" />
      </div>
      <div className="animate-pulse flex gap-6 border-y border-[var(--pg-divider-line)] py-3">
        <div className="h-4 w-24 rounded pg-skeleton-block" />
        <div className="h-4 w-28 rounded pg-skeleton-block" />
        <div className="h-4 w-20 rounded pg-skeleton-block" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="order-1 lg:order-2">
          <ActivitySkeleton />
        </div>
        <div className="order-2 flex flex-col gap-5 lg:order-1">
          <WorkspaceSkeleton />
          <div className="h-36 animate-pulse rounded-[28px] border border-[var(--pg-card-border)] bg-[var(--pg-card-bg)] pg-skeleton-subtle" />
        </div>
      </div>
    </div>
  );
}
