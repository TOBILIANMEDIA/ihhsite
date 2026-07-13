"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Zap, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { dailySignIn } from "@/app/actions/account"
import { SITE } from "@/lib/plans"
import { cn } from "@/lib/utils"

export function DailyBonusStrip({ signedInToday = false }: { signedInToday?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [done, setDone] = useState(signedInToday)

  function handleClaim() {
    if (done) { toast.info("Daily bonus already claimed today"); return }
    start(async () => {
      const res = await dailySignIn()
      if (res.ok) {
        toast.success(res.message)
        setDone(true)
        router.refresh()
      } else if ("requiresInvestment" in res && res.requiresInvestment) {
        toast.error(res.message, {
          action: { label: "Invest Now", onClick: () => router.push("/products") },
        })
      } else {
        toast.info(res.message)
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/8 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <p className="text-sm font-medium text-success">Daily bonus claimed — come back tomorrow</p>
      </div>
    )
  }

  return (
    <button
      onClick={handleClaim}
      disabled={pending}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-primary/25 bg-primary/8 px-4 py-3.5 text-left transition-all",
        "hover:border-primary/40 hover:bg-primary/12 active:scale-[0.99] disabled:opacity-60",
      )}
    >
      {/* Subtle animated shimmer */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/6 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Zap className="h-4 w-4 text-primary" />
        )}
        {!pending && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
        )}
      </span>

      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">Claim your daily bonus</span>
        <span className="text-xs font-medium text-primary">
          +&#8358;{Number(SITE.signInBonus).toLocaleString()} — tap to collect
        </span>
      </div>

      <span className="text-xs font-bold text-primary transition-transform duration-200 group-hover:translate-x-0.5">
        &#8594;
      </span>
    </button>
  )
}
