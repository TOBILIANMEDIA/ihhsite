"use client"

import { useState, useTransition, useCallback } from "react"
import { Loader2, Package, RotateCcw, Pencil, Check, X, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { PLANS, PLAN_TIERS, formatNaira } from "@/lib/plans"
import { setPlanSlot, resetPlanSoldSlots, getPlanSlots } from "@/app/actions/admin"
import { cn } from "@/lib/utils"

type SlotRow = {
  planId: number
  totalSlots: number | null
  soldSlots: number
  isActive: boolean
}

const TIER_COLORS: Record<string, string> = {
  Foundation: "text-stone-500 bg-stone-400/10 border-stone-400/20",
  Structure:  "text-primary bg-primary/10 border-primary/20",
  Framework:  "text-sky-600 bg-sky-400/10 border-sky-400/20",
  Skyline:    "text-amber-600 bg-amber-400/10 border-amber-400/20",
}

export function PlanSlotsPanel({ initialSlots }: { initialSlots: SlotRow[] }) {
  const [slots, setSlots] = useState<SlotRow[]>(initialSlots)
  const [editing, setEditing] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [pending, startTransition] = useTransition()

  const getSlot = useCallback(
    (planId: number): SlotRow =>
      slots.find((s) => s.planId === planId) ?? { planId, totalSlots: null, soldSlots: 0, isActive: true },
    [slots],
  )

  function applyUpdate(updated: SlotRow) {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.planId === updated.planId)
      if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next }
      return [...prev, updated]
    })
  }

  function startEdit(planId: number) {
    const slot = getSlot(planId)
    setEditValue(slot.totalSlots != null ? String(slot.totalSlots) : "")
    setEditing(planId)
  }

  function commitEdit(planId: number) {
    const slot = getSlot(planId)
    const parsed = editValue.trim() === "" ? null : parseInt(editValue, 10)
    if (parsed !== null && (isNaN(parsed) || parsed < 1)) {
      toast.error("Enter a positive number or leave blank for unlimited")
      return
    }
    startTransition(async () => {
      const res = await setPlanSlot(planId, { totalSlots: parsed, isActive: slot.isActive })
      if (res.ok) {
        applyUpdate({ ...slot, totalSlots: parsed })
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
      setEditing(null)
    })
  }

  function toggleActive(planId: number) {
    const slot = getSlot(planId)
    startTransition(async () => {
      const res = await setPlanSlot(planId, { totalSlots: slot.totalSlots, isActive: !slot.isActive })
      if (res.ok) {
        applyUpdate({ ...slot, isActive: !slot.isActive })
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    })
  }

  function handleReset(planId: number) {
    startTransition(async () => {
      const res = await resetPlanSoldSlots(planId)
      if (res.ok) {
        const slot = getSlot(planId)
        applyUpdate({ ...slot, soldSlots: 0 })
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Plan Slot Control</h3>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Set how many slots are available per plan. Leave blank for unlimited. When all slots are sold, the plan shows as Sold Out.
        </p>
      </div>

      <div className="divide-y divide-border/40">
        {PLANS.map((plan) => {
          const slot = getSlot(plan.id)
          const tier = PLAN_TIERS[plan.id]
          const tintClass = TIER_COLORS[tier?.phase ?? "Structure"]
          const isSoldOut = !slot.isActive || (slot.totalSlots !== null && slot.soldSlots >= slot.totalSlots)
          const isEditingThis = editing === plan.id

          return (
            <div key={plan.id} className={cn("px-4 py-3", !slot.isActive && "opacity-50")}>
              <div className="flex items-center gap-3">
                {/* Plan info */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border", tintClass)}>
                      {tier?.label}
                    </span>
                    <span className="truncate text-xs font-semibold text-foreground">{plan.name}</span>
                    {isSoldOut && (
                      <span className="rounded-full border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {formatNaira(plan.price)} · Sold: {slot.soldSlots}
                    {slot.totalSlots != null ? ` / ${slot.totalSlots}` : " / ∞"}
                  </p>
                </div>

                {/* Slot input */}
                {isEditingThis ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={1}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="∞"
                      className="w-20 rounded-lg border border-primary/40 bg-secondary/60 px-2 py-1.5 text-xs font-mono outline-none focus:border-primary"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(plan.id); if (e.key === "Escape") setEditing(null) }}
                    />
                    <button
                      onClick={() => commitEdit(plan.id)}
                      disabled={pending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success hover:bg-success/25"
                    >
                      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Total slots display + edit */}
                    <button
                      onClick={() => startEdit(plan.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/50 px-2.5 py-1.5 text-xs hover:border-primary/40 hover:bg-secondary"
                    >
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        {slot.totalSlots != null ? slot.totalSlots : "∞"}
                      </span>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>

                    {/* Reset sold */}
                    <button
                      onClick={() => handleReset(plan.id)}
                      disabled={pending || slot.soldSlots === 0}
                      title="Reset sold count"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground hover:border-amber-400/40 hover:text-amber-500 disabled:opacity-30"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(plan.id)}
                      disabled={pending}
                      title={slot.isActive ? "Disable plan" : "Enable plan"}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-30"
                    >
                      {slot.isActive
                        ? <ToggleRight className="h-4 w-4 text-success" />
                        : <ToggleLeft className="h-4 w-4" />
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {slot.totalSlots != null && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full transition-all", isSoldOut ? "bg-destructive/60" : "bg-primary/60")}
                    style={{ width: `${Math.min(100, (slot.soldSlots / slot.totalSlots) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
