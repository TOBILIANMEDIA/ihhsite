"use client"

import { useRouter } from "next/navigation"
import { ArrowDownToLine, ArrowUpFromLine, Gift, Users } from "lucide-react"

const ACTIONS = [
  { label: "Deposit",  icon: ArrowDownToLine, href: "/topup",     color: "text-primary",      bg: "bg-primary/10",      border: "border-primary/20"      },
  { label: "Withdraw", icon: ArrowUpFromLine,  href: "/withdraw",  color: "text-success",      bg: "bg-success/10",      border: "border-success/20"      },
  { label: "Gift",     icon: Gift,             href: "/gift-code", color: "text-amber-500",    bg: "bg-amber-400/10",    border: "border-amber-400/20"    },
  { label: "Team",     icon: Users,            href: "/team",      color: "text-sky-500",      bg: "bg-sky-400/10",      border: "border-sky-400/20"      },
]

export function QuickActions(_props?: Record<string, unknown>) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => router.push(action.href)}
          className={`flex flex-col items-center gap-2.5 rounded-2xl border ${action.border} ${action.bg} px-2 py-3.5 transition-all hover:brightness-105 active:scale-[0.96]`}
        >
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/50 dark:bg-black/20 ${action.color}`}>
            <action.icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-[11px] font-semibold text-foreground/70">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
