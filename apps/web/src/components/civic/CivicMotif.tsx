'use client'

import { cn } from '@/lib/utils'

type CivicMotifProps = {
  className?: string
  /** Visual density — heroes use soft, dividers use compact */
  variant?: 'hero' | 'panel' | 'auth' | 'compact'
  /** Accessible caption for decorative meaning */
  caption?: string
}

/**
 * Subtle SA flag Y-shaped convergence motif.
 * "Many communities. One country." — decorative, never a pasted flag.
 */
export function CivicMotif({
  className,
  variant = 'hero',
  caption = 'Many communities. One country.',
}: CivicMotifProps) {
  const opacity =
    variant === 'hero' ? 0.14 : variant === 'panel' ? 0.1 : variant === 'auth' ? 0.12 : 0.08

  return (
    <div
      className={cn('civic-motif', className)}
      aria-hidden={caption ? undefined : true}
      role={caption ? 'img' : undefined}
      aria-label={caption}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 480"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="civicYBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(0 35 149)" stopOpacity={opacity} />
            <stop offset="100%" stopColor="rgb(0 35 149)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="civicYGreen" x1="100%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="rgb(0 122 77)" stopOpacity={opacity} />
            <stop offset="100%" stopColor="rgb(0 122 77)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="civicYGold" x1="50%" y1="100%" x2="50%" y2="40%">
            <stop offset="0%" stopColor="rgb(255 184 28)" stopOpacity={opacity * 1.2} />
            <stop offset="100%" stopColor="rgb(255 184 28)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Soft topo washes */}
        <circle cx="160" cy="120" r="180" fill="url(#civicYBlue)" />
        <circle cx="680" cy="100" r="160" fill="url(#civicYGreen)" />
        <circle cx="400" cy="420" r="200" fill="url(#civicYGold)" />
        {/* Y convergence — three arms meet at centre */}
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="motion-safe:animate-civic-draw"
          style={{ strokeDasharray: 120 }}
        >
          <path
            d="M120 80 L400 260"
            stroke="rgb(0 35 149)"
            strokeWidth="2.5"
            opacity={opacity * 2.2}
          />
          <path
            d="M680 80 L400 260"
            stroke="rgb(0 122 77)"
            strokeWidth="2.5"
            opacity={opacity * 2.2}
          />
          <path
            d="M400 260 L400 420"
            stroke="rgb(255 184 28)"
            strokeWidth="2.5"
            opacity={opacity * 2.4}
          />
          {/* Soft red accent tip — sparingly */}
          <path
            d="M400 420 L460 460"
            stroke="rgb(222 56 49)"
            strokeWidth="1.5"
            opacity={opacity * 1.4}
          />
        </g>
      </svg>
    </div>
  )
}

export function CivicYDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn('civic-y-divider', className)}
      role="presentation"
      aria-hidden
    />
  )
}
