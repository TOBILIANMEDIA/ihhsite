import Link from "next/link"
import { ArrowLeft, Clock, AlertCircle } from "lucide-react"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getUserDeposits } from "@/app/actions/deposit"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { DepositHistoryClient } from "./deposit-history-client"

export default async function DepositsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  const deposits = await getUserDeposits()

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Deposits" />
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Deposit History</h1>
            <p className="text-xs text-muted-foreground">View and check pending deposits</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Deposits are auto-detected within{" "}
            <span className="font-semibold text-foreground">0-30 minutes</span>. Use the{" "}
            <span className="font-semibold text-foreground">Check Payment</span> button to trigger an immediate check.
          </p>
        </div>

        {deposits.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-foreground">No deposits yet</p>
              <p className="text-sm text-muted-foreground">Start by making your first deposit</p>
            </div>
            <Link
              href="/topup"
              className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Make Deposit
            </Link>
          </div>
        ) : (
          <DepositHistoryClient deposits={deposits as Parameters<typeof DepositHistoryClient>[0]["deposits"]} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
