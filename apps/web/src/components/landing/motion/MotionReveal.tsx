'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type MotionRevealProps = {
  children: ReactNode
  className?: string
  /** Stagger delay in ms when parent uses stagger children */
  delayMs?: number
}

/**
 * IntersectionObserver entrance — opacity + translateY.
 * Falls back to immediate visibility for reduced motion.
 */
export function MotionReveal({
  children,
  className,
  delayMs = 0,
}: MotionRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      setVisible(true)
      return
    }
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    observer.observe(node)
    // Fail-safe so content never stays invisible if IO misses
    const fallback = window.setTimeout(() => setVisible(true), 2400)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [reduced])

  return (
    <div
      ref={ref}
      className={cn(
        'motion-reveal',
        visible && 'motion-reveal--visible',
        className
      )}
      style={
        reduced
          ? undefined
          : {
              transitionDelay: visible ? `${delayMs}ms` : '0ms',
            }
      }
    >
      {children}
    </div>
  )
}
