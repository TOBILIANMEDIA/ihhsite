'use client'

import { useState } from 'react'
import { Eye, EyeOff, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { formatNaira } from '@/lib/plans'
import { useRouter } from 'next/navigation'

export function BalanceCard({ balance, todayIncome }: { balance: number; todayIncome: number }) {
  const [show, setShow] = useState(true)
  const router = useRouter()

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5">
      {/* Subtle structural grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, oklch(1 0 0) 0px, oklch(1 0 0) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, oklch(1 0 0) 0px, oklch(1 0 0) 1px, transparent 1px, transparent 28px)',
        }}
      />
      {/* Cyan glow accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Available Balance
          </p>
          <button
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide balance' : 'Show balance'}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground transition-all hover:text-foreground"
          >
            {show ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        </div>

        <p className="mt-2 font-heading text-4xl font-bold tracking-tight tabular-nums text-foreground">
          {show ? formatNaira(balance) : '₦ ••••••'}
        </p>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
            <TrendingUp className="h-3.5 w-3.5" />
            {show ? `+${formatNaira(todayIncome)}` : '+₦ •••'} today
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => router.push('/topup')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/20 active:scale-[0.97]"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Deposit
          </button>
          <button
            onClick={() => router.push('/withdraw')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/60 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.97]"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
          </button>
        </div>
      </div>
    </section>
  )
}
