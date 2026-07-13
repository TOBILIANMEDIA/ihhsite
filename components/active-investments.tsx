"use client"

import { useState, useEffect, useTransition } from "react"
import { formatNaira, PLAN_TIERS } from "@/lib/plans"
import { Clock, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { toggleAutoReinvest } from "@/app/actions/investments"
import { cn } from "@/lib/utils"

type Inv = {
  id: number; planName: string; dailyEarning: string; amountEarned: string
  totalEarning: string; daysPaid: number; durationDays: number; status: string
  autoReinvest: boolean; lastPayoutAt: Date | string
}

function getTimeUntilNextPayout(lastPayoutAt: Date | string): string {
  const next = new Date(lastPayoutAt).getTime() + 24 * 60 * 60 * 1000
  const diff = next - Date.now()
  if (diff <= 0) return "Ready"
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Map plan name to tier phase for styling
function getTierPhase(planName: string): string {
  if (planName.toLowerCase().includes("foundation")) return "Foundation"
  if (planName.toLowerCase().includes("structure")) return "Structure"
  if (planName.toLowerCase().includes("framework")) return "Framework"
  if (planName.toLowerCase().includes("skyline")) return "Skyline"
  return "Structure"
}

const PHASE_COLORS: Record<string, { bar: string; text: string; badge: string }> = {
  Foundation: { bar: "bg-stone-400", text: "text-stone-400", badge: "bg-stone-400/15 text-stone-400" },
  Structure:  { bar: "bg-primary",   text: "text-primary",   badge: "bg-primary/15 text-primary"     },
  Framework:  { bar: "bg-sky-400",   text: "text-sky-400",   badge: "bg-sky-400/15 text-sky-400"     },
  Skyline:    { bar: "bg-amber-400", text: "text-amber-400", badge: "bg-amber-400/15 text-amber-400" },
}

export function ActiveInvestments({ investments }: { investments: Inv[] }) {
  const [, setTick] = useState(0)
  const [pending, startTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  function handleToggle(invId: number) {
    setTogglingId(invId)
    startTransition(async () => {
      const res = await toggleAutoReinvest(invId)
      toast[res.ok ? "success" : "error"](res.message)
      setTogglingId(null)
    })
  }

  if (investments.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight">Active Projects</h2>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
          {investments.filter((i) => i.status === "active").length} running
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {investments.map((inv) => {
          const pct = Math.min(100, Math.round((inv.daysPaid / inv.durationDays) * 100))
          const timeUntil = getTimeUntilNextPayout(inv.lastPayoutAt)
          const isReady = timeUntil === "Ready"
          const phase = getTierPhase(inv.planName)
          const colors = PHASE_COLORS[phase]

          return (
            <article key={inv.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              {/* Phase color bar */}
              <div className={cn("h-0.5 w-full", colors.bar)} />

              <div className="p-4">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold leading-tight">{inv.planName}</h3>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    inv.status === "active" ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
                  )}>
                    {inv.status}
                  </span>
                </div>

                {/* Earnings row */}
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Daily return</span>
                    <span className={cn("text-base font-bold tabular-nums", colors.text)}>
                      {formatNaira(Number(inv.dailyEarning))}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Earned so far</span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {formatNaira(Number(inv.amountEarned))}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full transition-all", colors.bar)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Day {inv.daysPaid} of {inv.durationDays}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{pct}%</span>
                  </div>
                </div>

                {/* Next payout + reinvest row */}
                {inv.status === "active" && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                      isReady ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
                    )}>
                      <Clock className="h-3 w-3" />
                      {isReady ? "Payout ready" : `Next: ${timeUntil}`}
                    </div>

                    {/* Auto-reinvest toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-muted-foreground">Reinvest</span>
                      <button
                        onClick={() => handleToggle(inv.id)}
                        disabled={pending && togglingId === inv.id}
                        className={cn(
                          "relative h-5 w-9 rounded-full transition-colors",
                          inv.autoReinvest ? "bg-primary/50" : "bg-secondary",
                        )}
                      >
                        {pending && togglingId === inv.id ? (
                          <Loader2 className="absolute left-1.5 top-1 h-3 w-3 animate-spin text-foreground" />
                        ) : (
                          <div className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-primary transition-all",
                            inv.autoReinvest ? "left-4" : "left-0.5",
                          )} />
                        )}
                      </button>
                    </label>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
