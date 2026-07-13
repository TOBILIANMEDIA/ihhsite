"use client"

import { useEffect, useRef } from "react"

/**
 * Wraps a page's <main> content and animates each direct child in with a
 * staggered fade-up entrance. Zero dependencies — uses pure CSS animations
 * via inline style delay.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const kids = Array.from(el.children) as HTMLElement[]
    kids.forEach((child, i) => {
      child.style.opacity = "0"
      child.style.transform = "translateY(14px)"
      child.style.transition = `opacity 0.35s ease ${i * 0.07}s, transform 0.35s ease ${i * 0.07}s`
      // Trigger next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          child.style.opacity = "1"
          child.style.transform = "translateY(0)"
        })
      })
    })
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
