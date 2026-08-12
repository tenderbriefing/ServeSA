'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Scroll progress (0–1) for a sticky story section.
 * Does not hijack scroll — only reads intersection geometry.
 */
export function useInViewProgress(): {
  ref: RefObject<HTMLDivElement>
  progress: number
} {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      setProgress(1)
      return
    }

    let frame = 0
    const update = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight || 1
      const total = Math.max(rect.height - viewH, 1)
      const scrolled = Math.min(Math.max(-rect.top, 0), total)
      setProgress(scrolled / total)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduced])

  return { ref, progress }
}
