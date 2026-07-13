"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, TrendingUp, CalendarDays, Coins, CheckCircle2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { type Plan, PLAN_TIERS, formatNaira } from "@/lib/plans"
import { buyPlan } from "@/app/actions/investments"
import { cn } from "@/lib/utils"

const TIER_STYLES: Record<string, { bar: string; badge: string; text: string; accent: string }> = {
  Foundation: { bar: "bg-stone-400",  badge: "bg-stone-400/15 text-stone-400",  text: "text-stone-400",  accent: "border-stone-400/20" },
  Structure:  { bar: "bg-primary",    badge: "bg-primary/15 text-primary",      text: "text-primary",    accent: "border-primary/25"  },
  Framework:  { bar: "bg-sky-400",    badge: "bg-sky-400/15 text-sky-400",      text: "text-sky-400",    accent: "border-sky-400/20"  },
  Skyline:    { bar: "bg-amber-400",  badge: "bg-amber-400/15 text-amber-400",  text: "text-amber-400",  accent: "border-amber-400/20" },
}

export function PlanCard({ plan }: { plan: Plan }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)
  const [autoReinvest, setAutoReinvest] = useState(true)

  const tier = PLAN_TIERS[plan.id]
  const style = TIER_STYLES[tier?.phase ?? "Structure"]

  function handleBuy() {
    startTransition(async () => {
      const res = await buyPlan(plan.id, { autoReinvest })
      if (res.ok) {
        toast.success(res.message)
        setConfirm(false)
        router.refresh()
      } else {
        toast.error(res.message)
        if (res.message.toLowerCase().includes("insufficient")) router.push(`/topup?plan=${plan.id}`)
      }
    })
  }

  return (
    <article className={cn(
      "relative overflow-hidden rounded-2xl border bg-card transition-all",
      confirm ? `border-primary/40` : `border-border/60 hover:border-primary/25`,
    )}>
      {/* Tier accent bar */}
      <div className={cn("h-0.5 w-full", style.bar)} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-black",
              style.accent, style.badge,
            )}>
              {tier?.label ?? plan.id}
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight text-foreground">{plan.name}</h3>
              <span className={cn("text-[10px] font-semibold uppercase tracking-widest", style.text)}>
                {tier?.phase ?? "Plan"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-black tabular-nums text-foreground">{formatNaira(plan.price)}</p>
            <p className="text-[10px] text-muted-foreground">investment</p>
          </div>
          {plan.popular && (
            <span className="absolute right-3 top-4 rounded-full bg-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-primary-foreground">
              Popular
            </span>
          )}
        </div>

        {/* Metrics row */}
        <div className="mt-3 grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 bg-secondary/30 text-center">
          <Metric icon={Coins} tint={style.text} label="Daily" value={formatNaira(plan.daily)} />
          <Metric icon={TrendingUp} tint="text-success" label="Total" value={formatNaira(plan.total)} />
          <Metric icon={CalendarDays} tint="text-muted-foreground" label="Days" value={`${plan.durationDays}d`} />
        </div>

        {/* CTA */}
        {confirm ? (
          <div className="mt-3 flex flex-col gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setAutoReinvest(!autoReinvest)}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors cursor-pointer",
                  autoReinvest ? "bg-primary/40" : "bg-secondary",
                )}
              >
                <div className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-primary transition-all",
                  autoReinvest ? "left-4" : "left-0.5",
                )} />
              </div>
              <span className="text-xs text-muted-foreground">Auto-reinvest earnings</span>
              {autoReinvest && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(false)}
                disabled={pending}
                className="flex flex-1 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={pending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all active:scale-[0.98]",
              style.accent, style.badge,
            )}
          >
            Invest {formatNaira(plan.price)}
          </button>
        )}
      </div>
    </article>
  )
}

function Metric({ icon: Icon, tint, label, value }: { icon: typeof Coins; tint: string; label: string; value: string }) {
  return (
    <div className="px-2 py-2.5">
      <Icon className={cn("mx-auto h-3.5 w-3.5", tint)} />
      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  )
}
