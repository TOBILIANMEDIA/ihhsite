"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { setWithdrawalCharges, getWithdrawalCharges } from "@/app/actions/system-config"
import type { WithdrawalCharges } from "@/lib/withdrawal"
import { Sliders, Percent, Banknote, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = { onUpdate?: () => void }

type Field = {
  key: keyof WithdrawalCharges
  label: string
  icon: React.ReactNode
  description: string
  min: number
  max?: number
  step: number
  prefix?: string
  suffix?: string
}

const FIELDS: Field[] = [
  {
    key: "fixedFeeNaira",
    label: "Fixed Withdrawal Fee",
    icon: <Banknote className="h-4 w-4" />,
    description: "Flat fee deducted from every withdrawal",
    min: 0, step: 10, prefix: "₦",
  },
  {
    key: "percentageFee",
    label: "Percentage Withdrawal Fee",
    icon: <Percent className="h-4 w-4" />,
    description: "Percentage of withdrawal amount deducted",
    min: 0, max: 100, step: 0.5, suffix: "%",
  },
  {
    key: "minWithdrawal",
    label: "Minimum Withdrawal",
    icon: <ArrowDownToLine className="h-4 w-4" />,
    description: "Least amount a user can withdraw",
    min: 0, step: 100, prefix: "₦",
  },
  {
    key: "minDeposit",
    label: "Minimum Deposit",
    icon: <ArrowUpFromLine className="h-4 w-4" />,
    description: "Least amount a user can deposit",
    min: 0, step: 100, prefix: "₦",
  },
  {
    key: "minInvestment",
    label: "Minimum Investment",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Least plan price allowed for investment",
    min: 0, step: 100, prefix: "₦",
  },
]

export function WithdrawalChargesConfig({ onUpdate }: Props) {
  const [charges, setChargesState] = useState<WithdrawalCharges | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getWithdrawalCharges().then((c) => {
      setChargesState(c)
      setLoading(false)
    })
  }, [])

  if (loading || !charges) return null

  const update = (key: keyof WithdrawalCharges, val: number) =>
    setChargesState((prev) => prev ? { ...prev, [key]: val } : prev)

  const handleSave = () => {
    startTransition(async () => {
      const result = await setWithdrawalCharges(charges)
      if (result.ok) {
        toast.success("Settings updated — changes apply immediately")
        onUpdate?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  // Fee preview on ₦10,000
  const exampleAmount = 10000
  const exampleFee = (charges.fixedFeeNaira ?? 0) + Math.round((exampleAmount * (charges.percentageFee ?? 0)) / 100)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/30 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sliders className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Platform Limits & Fees</h3>
          <p className="text-[11px] text-muted-foreground">Changes apply immediately site-wide</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Fee fields */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Withdrawal Fees</p>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.filter(f => f.key === "fixedFeeNaira" || f.key === "percentageFee").map((field) => (
            <ConfigField
              key={field.key}
              field={field}
              value={charges[field.key] ?? 0}
              onChange={(v) => update(field.key, v)}
            />
          ))}
        </div>

        {/* Fee preview */}
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/40 px-3.5 py-2.5">
          <span className="text-xs text-muted-foreground">Example: ₦10,000 withdrawal</span>
          <span className="text-xs font-bold">
            Fee: ₦{exampleFee.toLocaleString()} → receives ₦{(exampleAmount - exampleFee).toLocaleString()}
          </span>
        </div>

        {/* Limits fields */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-1">Platform Limits</p>
        <div className="grid grid-cols-3 gap-3">
          {FIELDS.filter(f => f.key !== "fixedFeeNaira" && f.key !== "percentageFee").map((field) => (
            <ConfigField
              key={field.key}
              field={field}
              value={charges[field.key] ?? 0}
              onChange={(v) => update(field.key, v)}
            />
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={pending}
          className={cn(
            "w-full rounded-xl px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all",
            pending
              ? "bg-primary/60 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 active:scale-[0.98]",
          )}
        >
          {pending ? "Saving…" : "Save All Settings"}
        </button>
      </div>
    </div>
  )
}

function ConfigField({ field, value, onChange }: {
  field: Field
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-primary">{field.icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
          {field.label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {field.prefix && <span className="text-xs font-bold text-muted-foreground">{field.prefix}</span>}
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {field.suffix && <span className="text-xs font-bold text-muted-foreground">{field.suffix}</span>}
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight">{field.description}</p>
    </div>
  )
}
