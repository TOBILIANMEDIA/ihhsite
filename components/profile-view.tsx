"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDownToLine, ArrowUpFromLine, Gift, Users, Wallet,
  Headphones, ChevronRight, LogOut, ListOrdered, ShieldCheck,
  Loader2, Clock, Copy, CheckCheck,
} from "lucide-react"
import { toast } from "sonner"
import { SITE, formatNaira } from "@/lib/plans"
import { authClient } from "@/lib/auth-client"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

type Props = {
  name: string; email: string; phone: string; role: string
  balance: number; totalDeposited: number; totalEarned: number; referralEarnings: number
}

export function ProfileView(props: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const initials = props.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "CI"

  const menuGroups = [
    {
      title: "Wallet",
      items: [
        { label: "Deposit",         icon: ArrowDownToLine, href: "/topup",      tint: "text-success",   bg: "bg-success/10"   },
        { label: "Withdraw",        icon: ArrowUpFromLine, href: "/withdraw",   tint: "text-amber-500", bg: "bg-amber-400/10" },
        { label: "Transactions",    icon: ListOrdered,     href: "/transactions",tint: "text-primary",  bg: "bg-primary/10"   },
        { label: "Deposit History", icon: Clock,           href: "/deposits",   tint: "text-muted-foreground", bg: "bg-secondary"  },
      ],
    },
    {
      title: "Community",
      items: [
        { label: "My Team",   icon: Users,      href: "/team",            tint: "text-sky-400",   bg: "bg-sky-400/10"  },
        { label: "Gift Code", icon: Gift,        href: "/gift-code",      tint: "text-primary",   bg: "bg-primary/10"  },
        { label: "Support",   icon: Headphones,  href: SITE.telegramGroup, tint: "text-muted-foreground", bg: "bg-secondary" },
      ],
    },
    ...(props.role === "admin"
      ? [{
          title: "Admin",
          items: [
            { label: "Admin Console", icon: ShieldCheck, href: "/admin", tint: "text-destructive", bg: "bg-destructive/10" },
          ],
        }]
      : []),
  ]

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut()
      toast.success("Signed out")
      router.push("/")
      router.refresh()
    })
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(SITE.inviteCode)
      setCopied(true)
      toast.success("Invite code copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
      {/* Identity card */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5">
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, oklch(1 0 0) 0px, oklch(1 0 0) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, oklch(1 0 0) 0px, oklch(1 0 0) 1px, transparent 1px, transparent 32px)' }}
        />
        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/15 blur-2xl" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-lg font-black text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold leading-tight">{props.name}</h2>
            <p className="truncate text-xs text-muted-foreground">{props.email}</p>
            {props.phone && <p className="text-xs text-muted-foreground">{props.phone}</p>}
          </div>
          <Logo className="h-8 w-8 shrink-0 opacity-60" />
        </div>

        {/* Balance */}
        <div className="relative mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-secondary/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Balance</span>
          </div>
          <span className="text-base font-bold tabular-nums">{formatNaira(props.balance)}</span>
        </div>

        {/* Invite code */}
        <button
          onClick={copyInvite}
          className="relative mt-2 flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/8 px-4 py-2.5 transition-all hover:bg-primary/15 active:scale-[0.99]"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Invite Code</span>
            <span className="text-sm font-black text-primary">{SITE.inviteCode}</span>
          </div>
          {copied ? <CheckCheck className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Deposited",  value: formatNaira(props.totalDeposited), tint: "text-foreground"  },
          { label: "Earned",     value: formatNaira(props.totalEarned),    tint: "text-success"     },
          { label: "Referral",   value: formatNaira(props.referralEarnings), tint: "text-primary"   },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</span>
            <span className={cn("text-sm font-bold tabular-nums leading-tight", s.tint)}>{s.value}</span>
          </div>
        ))}
      </section>

      {/* Grouped menu */}
      {menuGroups.map((group) => (
        <section key={group.title}>
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {group.title}
          </p>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            {group.items.map((item, i) => (
              <button
                key={item.label}
                onClick={() => item.href.startsWith("http") ? window.open(item.href, "_blank") : router.push(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-secondary/50 active:bg-secondary/70",
                  i !== group.items.length - 1 && "border-b border-border/40",
                )}
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", item.bg, item.tint)}>
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/8 py-3 text-sm font-semibold text-destructive transition-all hover:bg-destructive/15 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        Sign Out
      </button>

      <p className="pb-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground/40">
        {SITE.short} &bull; {SITE.tagline}
      </p>
    </main>
  )
}
