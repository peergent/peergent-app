import Skeleton from "@/components/ui/Skeleton";

export default function PgHomeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[var(--pg-container-content)] space-y-10">
      <div className="space-y-3">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="text" className="h-8 w-full max-w-lg" />
        <Skeleton variant="text" className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-3 w-20" />
        <Skeleton variant="rectangular" className="h-24 rounded-[var(--pg-radius-lg)]" />
      </div>
      <Skeleton variant="rectangular" className="h-36 rounded-[var(--pg-radius-lg)]" />
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton variant="rectangular" className="h-40 rounded-[var(--pg-radius-lg)]" />
        <Skeleton variant="rectangular" className="h-40 rounded-[var(--pg-radius-lg)]" />
      </div>
    </div>
  );
}
