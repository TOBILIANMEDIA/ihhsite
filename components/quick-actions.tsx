"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Gift, LogIn, UserPlus, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { dailySignIn } from "@/app/actions/account"
import { SITE } from "@/lib/plans"

export function QuickActions({
  signedInToday = false,
}: {
  signedInToday?: boolean
  freeSlotAvailable?: boolean
  hasActiveInvestment?: boolean
  drawOpen?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(signedInToday)

  function handleSignIn() {
    if (done) { toast.info("Daily bonus already claimed"); return }
    startTransition(async () => {
      const res = await dailySignIn()
      if (res.ok) {
        toast.success(res.message)
        setDone(true)
        router.refresh()
      } else if ("requiresInvestment" in res && res.requiresInvestment) {
        toast.error(res.message, { action: { label: "Invest Now", onClick: () => router.push("/products") } })
      } else {
        toast.info(res.message)
        setDone(true)
      }
    })
  }

  const actions = [
    { label: "Deposit",  icon: "↓", href: "/topup",     color: "text-primary",  bg: "bg-primary/10",   border: "border-primary/20"  },
    { label: "Withdraw", icon: "↑", href: "/withdraw",   color: "text-success",  bg: "bg-success/10",   border: "border-success/20"  },
    { label: "Gift",     icon: "◇", href: "/gift-code",  color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    { label: "Invite",   icon: "+", href: "/team",       color: "text-sky-400",  bg: "bg-sky-400/10",   border: "border-sky-400/20"  },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Daily sign-in banner */}
      {!done ? (
        <button
          onClick={handleSignIn}
          disabled={pending}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-left transition-all active:scale-[0.99] disabled:opacity-60"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15">
            <LogIn className="h-4 w-4 text-primary" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">Claim daily sign-in bonus</span>
            <span className="text-xs font-medium text-primary">
              Earn ₦{SITE.signInBonus} now — tap to collect
            </span>
          </div>
          <span className="text-xs text-muted-foreground">→</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/8 px-4 py-3">
          <CheckCircle2 className="h-4.5 w-4.5 text-success" />
          <span className="text-sm font-medium text-success">Daily bonus claimed — come back tomorrow</span>
        </div>
      )}

      {/* Quick action grid */}
      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`flex flex-col items-center gap-2 rounded-xl border ${action.border} ${action.bg} px-2 py-3 transition-all active:scale-[0.97]`}
          >
            <span className={`text-lg font-bold leading-none ${action.color}`}>{action.icon}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
