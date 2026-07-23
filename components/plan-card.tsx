"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, TrendingUp, Clock, Zap, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { type Plan, PLAN_TIERS, formatNaira } from "@/lib/plans"
import { buyPlan } from "@/app/actions/investments"
import { cn } from "@/lib/utils"

export type SlotInfo = {
  planId: number
  totalSlots: number | null
  soldSlots: number
  isActive: boolean
}

// Per-tier gradient and color config
const TIER_CONFIG: Record<string, {
  gradient: string
  headerText: string
  accentBg: string
  accentText: string
  badge: string
  btn: string
  btnText: string
  ring: string
  dot: string
}> = {
  Foundation: {
    gradient:   "from-slate-700 via-slate-800 to-slate-900",
    headerText: "text-slate-100",
    accentBg:   "bg-slate-600/40",
    accentText: "text-slate-200",
    badge:      "bg-slate-500/30 text-slate-300 border-slate-500/30",
    btn:        "bg-slate-100 hover:bg-white",
    btnText:    "text-slate-900",
    ring:       "ring-slate-500/30",
    dot:        "bg-slate-400",
  },
  Structure: {
    gradient:   "from-teal-600 via-teal-700 to-emerald-800",
    headerText: "text-white",
    accentBg:   "bg-white/15",
    accentText: "text-teal-100",
    badge:      "bg-white/20 text-white border-white/20",
    btn:        "bg-white hover:bg-teal-50",
    btnText:    "text-teal-800",
    ring:       "ring-teal-400/40",
    dot:        "bg-teal-300",
  },
  Framework: {
    gradient:   "from-sky-500 via-blue-600 to-blue-700",
    headerText: "text-white",
    accentBg:   "bg-white/15",
    accentText: "text-sky-100",
    badge:      "bg-white/20 text-white border-white/20",
    btn:        "bg-white hover:bg-sky-50",
    btnText:    "text-sky-800",
    ring:       "ring-sky-400/40",
    dot:        "bg-sky-300",
  },
  Skyline: {
    gradient:   "from-amber-500 via-orange-500 to-rose-600",
    headerText: "text-white",
    accentBg:   "bg-white/15",
    accentText: "text-amber-100",
    badge:      "bg-white/20 text-white border-white/20",
    btn:        "bg-white hover:bg-amber-50",
    btnText:    "text-amber-800",
    ring:       "ring-amber-400/40",
    dot:        "bg-amber-300",
  },
}

export function PlanCard({ plan, slot }: { plan: Plan; slot?: SlotInfo }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const tier = PLAN_TIERS[plan.id]
  const cfg = TIER_CONFIG[tier?.phase ?? "Structure"]

  // Slot states
  const isSoldOut = slot
    ? (!slot.isActive || (slot.totalSlots !== null && slot.soldSlots >= slot.totalSlots))
    : false
  const hasLimit    = slot?.totalSlots != null
  const remaining   = hasLimit ? Math.max(0, (slot!.totalSlots ?? 0) - slot!.soldSlots) : null
  const totalSlots  = slot?.totalSlots ?? null
  const fillPct     = hasLimit && totalSlots ? Math.min(100, Math.round((slot!.soldSlots / totalSlots) * 100)) : 0

  // ROI percentage
  const roiPct = Math.round(((plan.total - plan.price) / plan.price) * 100)

  function handleBuy() {
    startTransition(async () => {
      const res = await buyPlan(plan.id, {})
      if (res.ok) {
        toast.success(res.message)
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
        "group relative flex flex-col overflow-hidden rounded-2xl ring-1 transition-all duration-300",
        isSoldOut ? "opacity-70 ring-border/40" : [cfg.ring, "hover:-translate-y-1 hover:shadow-xl"],
      )}
    >
      {/* ---- Gradient header ---- */}
      <div className={cn("relative bg-gradient-to-br p-5", cfg.gradient)}>
        {/* Decorative dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* Top row: tier badge + popular + slots */}
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-80", cfg.headerText)}>
              {tier?.phase}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {plan.popular && !isSoldOut && (
              <span className="flex items-center gap-0.5 rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                <Zap className="h-2.5 w-2.5" /> Popular
              </span>
            )}
            {hasLimit && !isSoldOut && remaining !== null && (
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", cfg.badge)}>
                {remaining} left
              </span>
            )}
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", cfg.badge)}>
              {tier?.label}
            </span>
          </div>
        </div>

        {/* Plan name + price */}
        <div className="relative mt-4">
          <h3 className={cn("text-base font-black leading-tight tracking-tight", cfg.headerText)}>
            {plan.name}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-3xl font-black tabular-nums", cfg.headerText)}>
              {formatNaira(plan.price)}
            </span>
            <span className={cn("text-xs font-semibold opacity-70", cfg.headerText)}>capital</span>
          </div>
        </div>

        {/* ROI pill */}
        <div className="relative mt-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
            cfg.accentBg, cfg.accentText,
          )}>
            <ArrowUpRight className="h-3.5 w-3.5" />
            {roiPct}% total ROI over {plan.durationDays} days
          </span>
        </div>

        {/* Slot fill bar */}
        {hasLimit && !isSoldOut && totalSlots && (
          <div className="relative mt-3">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className={cn("mt-1 text-[10px] opacity-70", cfg.headerText)}>
              {slot!.soldSlots}/{totalSlots} slots filled
            </p>
          </div>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2">
              <Lock className="h-3.5 w-3.5 text-white/70" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Sold Out</span>
            </div>
          </div>
        )}
      </div>

      {/* ---- Stats body ---- */}
      <div className="flex flex-1 flex-col gap-3 bg-card p-4">
        {/* Daily + Duration + Total row */}
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Daily" value={formatNaira(plan.daily)} />
          <StatPill label="Duration" value={`${plan.durationDays}d`} />
          <StatPill label="Total" value={formatNaira(plan.total)} highlight />
        </div>

        {/* Action button */}
        {isSoldOut ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-secondary/40 py-3 text-sm font-semibold text-muted-foreground">
            <Lock className="h-4 w-4" />
            Sold Out
          </div>
        ) : (
          <button
            onClick={handleBuy}
            disabled={pending}
            className={cn(
              "group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold shadow transition-all",
              "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-70",
              cfg.btn, cfg.btnText,
            )}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
            {pending
              ? <Loader2 className="relative h-4 w-4 animate-spin" />
              : <TrendingUp className="relative h-4 w-4" />
            }
            <span className="relative">
              {pending ? "Processing…" : `Invest ${formatNaira(plan.price)}`}
            </span>
          </button>
        )}
      </div>
    </article>
  )
}

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center rounded-xl px-2 py-2.5 text-center",
      highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary/50",
    )}>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn(
        "mt-0.5 text-xs font-black tabular-nums",
        highlight ? "text-primary" : "text-foreground",
      )}>
        {value}
      </p>
    </div>
  )
}
