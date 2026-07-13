import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)} aria-label="C.I.Limited">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <rect width="48" height="48" rx="10" fill="oklch(0.20 0.01 220)" />
        <rect x="8"  y="11" width="32" height="4" rx="1.5" fill="oklch(0.65 0.08 210)" />
        <rect x="8"  y="19" width="22" height="4" rx="1.5" fill="oklch(0.65 0.08 210 / 75%)" />
        <rect x="8"  y="27" width="28" height="4" rx="1.5" fill="oklch(0.65 0.08 210 / 50%)" />
        <rect x="36" y="11" width="4"  height="24" rx="1.5" fill="oklch(1 0 0 / 15%)" />
        <circle cx="38" cy="38" r="2.5" fill="oklch(0.65 0.08 210)" />
      </svg>
    </div>
  )
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo className="h-8 w-8" />
      <div className="flex flex-col leading-none">
        <span className="text-[13px] font-bold tracking-tight text-foreground">C.I.Limited</span>
        <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Construction Investment
        </span>
      </div>
    </div>
  )
}
