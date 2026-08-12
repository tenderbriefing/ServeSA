'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DeviceFrameProps = {
  children: ReactNode
  className?: string
  /** Accessible label for the decorative device */
  label?: string
  variant?: 'phone' | 'panel'
}

/**
 * Lightweight product device chrome for landing storytelling.
 * Decorative — not interactive application chrome.
 */
export function DeviceFrame({
  children,
  className,
  label = 'Serve SA interface preview',
  variant = 'phone',
}: DeviceFrameProps) {
  if (variant === 'panel') {
    return (
      <div
        role="img"
        aria-label={label}
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-surface shadow-md',
          className
        )}
      >
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted/80 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-neutral-300" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-neutral-300" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-neutral-300" aria-hidden />
          <span className="ml-2 text-caption text-ink-subtle">Serve SA Operations</span>
        </div>
        <div className="bg-canvas p-3 sm:p-4">{children}</div>
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.75rem] border-[3px] border-neutral-800 bg-neutral-900 shadow-md',
        className
      )}
    >
      <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-neutral-900" aria-hidden />
      <div className="overflow-hidden rounded-[1.5rem] bg-canvas">{children}</div>
    </div>
  )
}
