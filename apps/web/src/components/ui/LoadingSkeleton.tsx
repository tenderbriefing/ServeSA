import { cn } from '@/lib/utils'

type LoadingSkeletonProps = {
  className?: string
  lines?: number
  label?: string
}

export function LoadingSkeleton({
  className,
  lines = 3,
  label = 'Loading',
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="loading-skeleton"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-4 animate-pulse rounded bg-surface-muted',
            index === 0 && 'w-2/3',
            index === 1 && 'w-full',
            index > 1 && 'w-5/6'
          )}
        />
      ))}
    </div>
  )
}

export function Spinner({
  label = 'Loading',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn('flex items-center justify-center gap-3 py-8', className)}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700"
        aria-hidden
      />
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  )
}
