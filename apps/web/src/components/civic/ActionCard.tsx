'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActionCardProps = {
  href: string
  title: string
  description: string
  icon: LucideIcon
  className?: string
}

/** Interactive destination card — border/hover only; not a decorative card stack. */
export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  className,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex gap-4 rounded-lg border border-border bg-surface p-5 transition-colors duration-fast ease-civic hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary-100 bg-primary-50 text-primary-700 transition-colors group-hover:border-primary-200 group-hover:bg-primary-100">
        <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
      </span>
      <span>
        <span className="block font-display text-h4 text-ink">{title}</span>
        <span className="mt-1 block text-body-sm text-ink-muted">
          {description}
        </span>
      </span>
    </Link>
  )
}
