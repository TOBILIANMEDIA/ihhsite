"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, CheckCircle2, Lock, TrendingUp, Clock } from "lucide-react"
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

const TIER_STYLES: Record<string, {
  bar: string; badge: string; text: string; accent: string
  glow: string; btnBg: string; btnText: string
}> = {
  Foundation: {
    bar: "bg-stone-400", badge: "bg-stone-400/15 text-stone-500", text: "text-stone-500",
    accent: "border-stone-400/25", glow: "hover:shadow-stone-300/20",
    btnBg: "bg-stone-500", btnText: "text-white",
  },
  Structure: {
    bar: "bg-primary", badge: "bg-primary/15 text-primary", text: "text-primary",
    accent: "border-primary/30", glow: "hover:shadow-primary/20",
    btnBg: "bg-primary", btnText: "text-primary-foreground",
  },
  Framework: {
    bar: "bg-sky-500", badge: "bg-sky-400/15 text-sky-600", text: "text-sky-600",
    accent: "border-sky-400/25", glow: "hover:shadow-sky-400/20",
    btnBg: "bg-sky-500", btnText: "text-white",
  },
  Skyline: {
    bar: "bg-amber-500", badge: "bg-amber-400/15 text-amber-600", text: "text-amber-600",
    accent: "border-amber-400/25", glow: "hover:shadow-amber-400/20",
    btnBg: "bg-amber-500", btnText: "text-white",
  },
}

const TIER_IMAGES: Record<string, string> = {
  Foundation: "/plans/foundation.png",
  Structure:  "/plans/structure.png",
  Framework:  "/plans/framework.png",
  Skyline:    "/plans/skyline.png",
}

export function PlanCard({ plan, slot }: { plan: Plan; slot?: SlotInfo }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  const tier = PLAN_TIERS[plan.id]
  const style = TIER_STYLES[tier?.phase ?? "Structure"]
  const image = TIER_IMAGES[tier?.phase ?? "Structure"]

  // Slot states
  const isSoldOut = slot
    ? (!slot.isActive || (slot.totalSlots !== null && slot.soldSlots >= slot.totalSlots))
    : false
  const hasLimit = slot?.totalSlots != null
  const remaining = hasLimit ? Math.max(0, (slot!.totalSlots ?? 0) - slot!.soldSlots) : null
  const totalSlots = slot?.totalSlots ?? null
  const fillPct = hasLimit && totalSlots ? Math.min(100, Math.round((slot!.soldSlots / totalSlots) * 100)) : 0

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
        "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        isSoldOut ? "border-border/40 opacity-80" : [
          "border-border/60",
          style.accent,
          style.glow,
          "hover:-translate-y-0.5 hover:shadow-lg",
        ],
        plan.popular && !isSoldOut && "border-primary/40",
      )}
    >
      {/* Top colour bar */}
      <div className={cn("h-1 w-full", style.bar)} />

      {/* Hero image */}
      <div className="relative h-32 w-full overflow-hidden">
        <Image
          src={image}
          alt={`${tier?.phase ?? ""} tier`}
          fill
          className={cn("object-cover transition-transform duration-500", !isSoldOut && "group-hover:scale-105")}
          sizes="(max-width: 768px) 100vw, 448px"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

        {/* SOLD OUT overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-4 py-2 shadow-lg">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sold Out</span>
            </div>
          </div>
        )}

        {/* Slot circle badge — top-right of image */}
        {hasLimit && !isSoldOut && (
          <div className={cn(
            "absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full shadow-lg ring-2 ring-white/20",
            style.btnBg,
          )}>
            <span className={cn("text-sm font-extrabold tabular-nums leading-none", style.btnText)}>
              {remaining}
            </span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
          <div>
            <p className={cn("text-[9px] font-bold uppercase tracking-widest", style.text)}>
              {tier?.phase}
            </p>
            <h3 className="text-sm font-bold leading-tight text-foreground drop-shadow-sm">{plan.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            {plan.popular && !isSoldOut && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                Popular
              </span>
            )}
            <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold shadow", style.badge)}>
              {tier?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Stats row */}
        <div className="mb-3 grid grid-cols-3 divide-x divide-border/40 overflow-hidden rounded-xl border border-border/40 bg-secondary/40">
          <Stat label="Capital"   value={formatNaira(plan.price)}        icon={<span className="text-[10px]">₦</span>}           tint={style.text} />
          <Stat label="Daily"     value={formatNaira(plan.daily)}         icon={<TrendingUp className="h-3 w-3" />}                tint={style.text} />
          <Stat label="Duration"  value={`${plan.durationDays}d`}         icon={<Clock className="h-3 w-3" />}                    tint={style.text} />
        </div>

        {/* Total return highlight */}
        <div className={cn(
          "mb-3 flex items-center justify-between rounded-xl px-3.5 py-2.5",
          "border border-border/40 bg-secondary/30",
        )}>
          <span className="text-xs text-muted-foreground">Total return over {plan.durationDays} days</span>
          <span className={cn("text-sm font-bold tabular-nums", style.text)}>{formatNaira(plan.total)}</span>
        </div>



        {/* Action buttons */}
        {isSoldOut ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-secondary/40 py-2.5 text-sm font-semibold text-muted-foreground">
            <Lock className="h-4 w-4" />
            Sold Out
          </div>
        ) : confirm ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs text-muted-foreground">
              Invest <span className="font-bold text-foreground">{formatNaira(plan.price)}</span> from your balance?
            </p>
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
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60",
                  style.btnBg, style.btnText,
                )}
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
              "group/btn relative flex w-full items-center justify-center overflow-hidden rounded-xl py-3 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]",
              style.btnBg, style.btnText,
            )}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
            Invest {formatNaira(plan.price)}
          </button>
        )}
      </div>
    </article>
  )
}


function Stat({ label, value, icon, tint }: { label: string; value: string; icon: React.ReactNode; tint: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-2.5">
      <span className={cn("flex items-center gap-0.5", tint)}>{icon}</span>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  )
}
