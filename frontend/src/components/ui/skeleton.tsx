import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800", className)}
      {...props}
    />
  );
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/80 dark:border-white/10 p-4",
        className
      )}
      {...props}
    >
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-3 w-16 mt-1" />
    </div>
  );
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("rounded-full shrink-0", className)}
      {...props}
    />
  );
}

function SkeletonText({
  className,
  lines = 1,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

function SkeletonMatchListItem() {
  return (
    <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200/80 dark:border-white/10">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
        <div className="space-y-2 min-w-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-8 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
      </div>
    </div>
  );
}

function SkeletonMatchList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMatchListItem key={i} />
      ))}
    </div>
  );
}

function SkeletonMatchDetail() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-9 w-12 ml-auto" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[80px]" />
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200/80 dark:border-white/10 p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-zinc-200/80 dark:border-white/10">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonPlanSubscription() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-9 w-64" />
      <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div className="space-y-8">
      <Card className="mb-6 border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
            <div className="w-full min-w-0 flex-1 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <section>
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[75%]" />
        </div>
      </section>
      <div className="flex justify-center">
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonText,
  SkeletonMatchList,
  SkeletonMatchListItem,
  SkeletonMatchDetail,
  SkeletonPlanSubscription,
  SkeletonProfile,
};
