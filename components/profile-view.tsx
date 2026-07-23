"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDownToLine, ArrowUpFromLine, Gift, Users, Wallet,
  Headphones, ChevronRight, LogOut, ListOrdered, ShieldCheck,
  Loader2, Clock, Copy, CheckCheck,
} from "lucide-react"
import { toast } from "sonner"
import { SITE, formatNaira } from "@/lib/plans"
import { getTelegramConfig } from "@/app/actions/system-config"
import type { TelegramConfig } from "@/app/actions/system-config"
import { authClient } from "@/lib/auth-client"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

type Props = {
  name: string; email: string; phone: string; role: string; inviteCode: string
  balance: number; frozenBalance: number; totalDeposited: number; totalEarned: number; referralEarnings: number
}

export function ProfileView(props: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [tg, setTg] = useState<TelegramConfig | null>(null)

  useEffect(() => { getTelegramConfig().then(setTg) }, [])

  const initials = props.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "CI"

  const supportLink = tg?.supportUsername
    ? `https://t.me/${tg.supportUsername.replace(/^@/, "")}`
    : tg?.groupLink ?? SITE.telegramGroup

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
        { label: "Support",   icon: Headphones,  href: supportLink,        tint: "text-muted-foreground", bg: "bg-secondary" },
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
      await navigator.clipboard.writeText(props.inviteCode)
      setCopied(true)
      toast.success("Invite code copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
      {/* Header with user info */}
      <section className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Welcome back</p>
          <h2 className="text-xl font-bold leading-tight">{props.name}</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-sm font-black text-primary">
          {initials}
        </div>
      </section>

      {/* Gradient wallet cards */}
      <section className="space-y-2.5">
        {/* Active Balance */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-5 text-white shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/10 blur-xl" />
          <p className="relative text-xs font-semibold uppercase tracking-wide opacity-90">Active Balance</p>
          <p className="relative mt-3 text-3xl font-black tabular-nums">{formatNaira(props.balance)}</p>
          <p className="relative mt-1 text-xs opacity-80">Available to withdraw</p>
        </div>

        {/* Frozen Balance */}
        {props.frozenBalance > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-md">
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/10 blur-xl" />
            <p className="relative text-xs font-semibold uppercase tracking-wide opacity-90">Frozen Balance</p>
            <p className="relative mt-3 text-3xl font-black tabular-nums">{formatNaira(props.frozenBalance)}</p>
            <p className="relative mt-1 text-xs opacity-80">Unlocks after your first investment</p>
          </div>
        )}

        {/* Total Balance */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-5 text-white shadow-md">
          <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/10 blur-xl" />
          <p className="relative text-xs font-semibold uppercase tracking-wide opacity-90">Total Balance</p>
          <p className="relative mt-3 text-3xl font-black tabular-nums">{formatNaira(props.balance + props.frozenBalance)}</p>
          <p className="relative mt-1 text-xs opacity-80">Active + Frozen</p>
        </div>
      </section>

      {/* Earnings breakdown */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Earned</p>
          <p className="mt-3 text-2xl font-black text-success tabular-nums">{formatNaira(props.totalEarned)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referral Income</p>
          <p className="mt-3 text-2xl font-black text-primary tabular-nums">{formatNaira(props.referralEarnings)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Deposited</p>
          <p className="mt-3 text-2xl font-black text-sky-500 tabular-nums">{formatNaira(props.totalDeposited)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account Level</p>
          <p className="mt-3 text-lg font-bold text-amber-500">{props.role}</p>
        </div>
      </section>

      {/* Referral code card */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Referral Code</p>
        <button
          onClick={copyInvite}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-background/80 px-4 py-3 transition-all hover:bg-background active:scale-95"
        >
          <span className="text-lg font-black text-primary">{props.inviteCode}</span>
          {copied ? <CheckCheck className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">Share to earn 21% on referrals</p>
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
