"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, TrendingUp, CalendarDays, Coins, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { type Plan, PLAN_TIERS, formatNaira } from "@/lib/plans"
import { buyPlan } from "@/app/actions/investments"
import { cn } from "@/lib/utils"

const TIER_STYLES: Record<string, { bar: string; badge: string; text: string; accent: string; glow: string }> = {
  Foundation: { bar: "bg-stone-400",  badge: "bg-stone-400/15 text-stone-400",  text: "text-stone-400",  accent: "border-stone-400/20",  glow: "hover:shadow-stone-400/10"  },
  Structure:  { bar: "bg-primary",    badge: "bg-primary/15 text-primary",      text: "text-primary",    accent: "border-primary/25",    glow: "hover:shadow-primary/10"    },
  Framework:  { bar: "bg-sky-400",    badge: "bg-sky-400/15 text-sky-400",      text: "text-sky-400",    accent: "border-sky-400/20",    glow: "hover:shadow-sky-400/10"    },
  Skyline:    { bar: "bg-amber-400",  badge: "bg-amber-400/15 text-amber-400",  text: "text-amber-400",  accent: "border-amber-400/20",  glow: "hover:shadow-amber-400/10"  },
}

const TIER_IMAGES: Record<string, string> = {
  Foundation: "/plans/foundation.png",
  Structure:  "/plans/structure.png",
  Framework:  "/plans/framework.png",
  Skyline:    "/plans/skyline.png",
}

export function PlanCard({ plan }: { plan: Plan }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  const tier = PLAN_TIERS[plan.id]
  const style = TIER_STYLES[tier?.phase ?? "Structure"]
  const image = TIER_IMAGES[tier?.phase ?? "Structure"]

  function handleBuy() {
    startTransition(async () => {
      const res = await buyPlan(plan.id, {})
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
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        plan.popular ? "border-primary/40" : "border-border/60",
        style.glow,
      )}
    >
      {/* Tier colour bar at top */}
      <div className={cn("h-0.5 w-full", style.bar)} />

      {/* Tier image */}
      <div className="relative h-28 w-full overflow-hidden">
        <Image
          src={image}
          alt={`${tier?.phase ?? ""} construction tier`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 448px"
        />
        {/* Gradient overlay so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        {/* Badges over image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
          <div>
            <span className={cn("text-[9px] font-bold uppercase tracking-widest", style.text)}>
              {tier?.phase}
            </span>
            <h3 className="text-sm font-bold leading-tight text-foreground">{plan.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            {plan.popular && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                Popular
              </span>
            )}
            <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm", style.badge)}>
              {tier?.label}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 pt-3">
        {/* Metrics row */}
        <div className="mb-3 grid grid-cols-3 divide-x divide-border/40 rounded-xl border border-border/40 bg-secondary/30 text-center">
          <Metric icon={Coins}        tint={style.text} label="Capital"  value={formatNaira(plan.price)}  />
          <Metric icon={TrendingUp}   tint={style.text} label="Daily"    value={formatNaira(plan.daily)}  />
          <Metric icon={CalendarDays} tint={style.text} label="In 30d"   value={formatNaira(plan.total)}  />
        </div>

        {/* Confirm panel */}
        {confirm ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(false)}
                disabled={pending}
                className="flex flex-1 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 py-2.5 text-sm font-semibold transition-all hover:bg-secondary active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={pending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
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
              "flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-bold transition-all active:scale-[0.97]",
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
    <div className="px-2 py-2.5 text-center">
      <Icon className={cn("mx-auto h-3.5 w-3.5", tint)} />
      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  )
}
