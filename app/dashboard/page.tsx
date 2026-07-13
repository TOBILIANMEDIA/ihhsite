import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getDashboardData } from "@/app/actions/account"
import { getInvestments, getPublicPlanSlots } from "@/app/actions/investments"
import { getPendingDeposits } from "@/app/actions/deposit"
import { db } from "@/lib/db"
import { investment } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { BalanceCard } from "@/components/balance-card"
import { QuickActions } from "@/components/quick-actions"
import { PlanCard } from "@/components/plan-card"
import { ActiveInvestments } from "@/components/active-investments"
import { DailyBonusStrip } from "@/components/daily-bonus-strip"
import { WelcomePopup } from "@/components/welcome-popup"
import { PendingDepositPopup } from "@/components/pending-deposit-popup"
import { PageTransition } from "@/components/page-transition"
import { PLANS, SITE } from "@/lib/plans"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")

  const userId = session.user.id

  const [data, investments, pendingDeposits, planSlots] = await Promise.all([
    getDashboardData(),
    getInvestments(),
    getPendingDeposits(),
    getPublicPlanSlots(),
  ])

  const todayIncome = investments
    .filter((i) => i.status === "active")
    .reduce((s, i) => s + Number(i.dailyEarning), 0)

  // Tier summary for dashboard header
  const activeCount = investments.filter((i) => i.status === "active").length

  return (
    <div className="min-h-screen pb-24">
      <WelcomePopup />
      <PendingDepositPopup deposits={pendingDeposits} />
      <AppHeader />

      <main className="mx-auto max-w-md px-4 py-5">
        <PageTransition className="flex flex-col gap-5">
        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {SITE.short} Portal
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-foreground text-balance">
              {data.name}
            </h1>
          </div>
          {data.isPromoter && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400">
              Promoter
            </span>
          )}
        </div>

        <BalanceCard balance={data.balance} todayIncome={todayIncome} />

        <QuickActions />

        <DailyBonusStrip signedInToday={data.signedInToday} />

        <ActiveInvestments investments={investments} />

        {/* Investment Plans */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight">Construction Plans</h2>
              <p className="text-[11px] text-muted-foreground">Foundation &rarr; Skyline</p>
            </div>
            <Link
              href="/products"
              className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {PLANS.slice(0, 4).map((plan) => (
              <PlanCard key={plan.id} plan={plan} slot={planSlots.find((s) => s.planId === plan.id)} />
            ))}
          </div>
        </section>
        </PageTransition>
      </main>

      <BottomNav />
    </div>
  )
}
