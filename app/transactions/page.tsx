import { redirect } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight, Gift, TrendingUp, Users, Receipt, Wallet } from "lucide-react"
import { getSession } from "@/lib/session"
import { getTransactions } from "@/app/actions/account"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { formatNaira } from "@/lib/plans"

export const dynamic = "force-dynamic"

const META: Record<string, { icon: typeof Gift; tint: string; bg: string; sign: string }> = {
  deposit:    { icon: ArrowDownLeft, tint: "text-success",      bg: "bg-success/15",      sign: "+" },
  withdrawal: { icon: ArrowUpRight,  tint: "text-amber-400",    bg: "bg-amber-400/15",    sign: "-" },
  earning:    { icon: TrendingUp,    tint: "text-success",      bg: "bg-success/15",      sign: "+" },
  referral:   { icon: Users,         tint: "text-primary",      bg: "bg-primary/15",      sign: "+" },
  bonus:      { icon: Gift,          tint: "text-primary",      bg: "bg-primary/15",      sign: "+" },
  investment: { icon: Receipt,       tint: "text-muted-foreground", bg: "bg-secondary",   sign: "-" },
  refund:     { icon: ArrowDownLeft, tint: "text-success",      bg: "bg-success/15",      sign: "+" },
  credit:     { icon: ArrowDownLeft, tint: "text-success",      bg: "bg-success/15",      sign: "+" },
  debit:      { icon: ArrowUpRight,  tint: "text-destructive",  bg: "bg-destructive/15",  sign: "-" },
}

export default async function TransactionsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  const txns = await getTransactions(100)

  const totalIn = txns.filter((t) => (META[t.type]?.sign ?? "+") === "+").reduce((s, t) => s + Number(t.amount), 0)
  const totalOut = txns.filter((t) => META[t.type]?.sign === "-").reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Wallet" />

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-success/20 bg-success/8 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total In</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-success">{formatNaira(totalIn)}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Out</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-amber-400">{formatNaira(totalOut)}</p>
          </div>
        </div>

        {/* Transaction list */}
        {txns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-14 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground/60">Your wallet activity will appear here</p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="text-sm font-bold">Transaction History</h2>
              <p className="text-[11px] text-muted-foreground">{txns.length} records</p>
            </div>
            {txns.map((t, i) => {
              const meta = META[t.type] ?? META.bonus
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i !== txns.length - 1 ? "border-b border-border/40" : ""}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                    <meta.icon className={`h-4 w-4 ${meta.tint}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize leading-tight">{t.description ?? t.type}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                      {t.status === "pending" && (
                        <span className="ml-1.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                          PENDING
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${meta.tint}`}>
                    {meta.sign}{formatNaira(Number(t.amount))}
                  </span>
                </div>
              )
            })}
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
