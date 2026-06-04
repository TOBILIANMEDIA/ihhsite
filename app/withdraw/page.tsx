import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getDashboardData } from "@/app/actions/account"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { WithdrawForm } from "@/components/withdraw-form"

export const dynamic = "force-dynamic"

export default async function WithdrawPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")
  const data = await getDashboardData()

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Withdraw" />
      <WithdrawForm balance={data.balance} />
      <BottomNav />
    </div>
  )
}
