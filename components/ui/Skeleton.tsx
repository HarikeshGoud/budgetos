export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-2 w-full" />
    </div>
  )
}
