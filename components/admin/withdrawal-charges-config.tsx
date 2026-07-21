"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { setWithdrawalCharges, getWithdrawalCharges } from "@/app/actions/system-config"
import type { WithdrawalCharges } from "@/lib/withdrawal"
import { Sliders } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = { onUpdate?: () => void }

export function WithdrawalChargesConfig({ onUpdate }: Props) {
  const [charges, setCharges] = useState<WithdrawalCharges | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()

  // Load current charges on mount
  useEffect(() => {
    getWithdrawalCharges().then((c) => {
      setCharges(c)
      setLoading(false)
    })
  }, [])

  if (loading || !charges) return null

  const handleSave = () => {
    startTransition(async () => {
      const result = await setWithdrawalCharges(charges)
      if (result.ok) {
        toast.success("Withdrawal charges updated")
        onUpdate?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Sliders className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Withdrawal Charges Configuration</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fixed Fee */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fixed Fee (₦)
          </label>
          <input
            type="number"
            min="0"
            step="10"
            value={charges.fixedFeeNaira}
            onChange={(e) => setCharges({ ...charges, fixedFeeNaira: Number(e.target.value) })}
            className={cn(
              "mt-2 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-mono",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">Fixed fee applied to every withdrawal</p>
        </div>

        {/* Percentage Fee */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Percentage Fee (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={charges.percentageFee}
            onChange={(e) => setCharges({ ...charges, percentageFee: Number(e.target.value) })}
            className={cn(
              "mt-2 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-mono",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">Percentage of withdrawal amount</p>
        </div>
      </div>

      {/* Fee Preview */}
      <div className="rounded-lg bg-secondary/50 p-3">
        <p className="text-xs text-muted-foreground">Example: ₦10,000 withdrawal</p>
        <p className="mt-1 text-sm font-semibold">
          Total fee: ₦{charges.fixedFeeNaira + Math.round((10000 * charges.percentageFee) / 100)} (fixed ₦{charges.fixedFeeNaira} + {charges.percentageFee}% = ₦{Math.round((10000 * charges.percentageFee) / 100)})
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={pending}
        className={cn(
          "w-full rounded-lg px-4 py-2.5 font-semibold text-sm text-white transition-all",
          pending
            ? "bg-primary/60 cursor-not-allowed"
            : "bg-primary hover:bg-primary/90 active:scale-95"
        )}
      >
        {pending ? "Updating..." : "Update Charges"}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Changes apply immediately to all new and pending withdrawals
      </p>
    </div>
  )
}
