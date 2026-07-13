import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getWithdrawStatus } from "@/app/actions/wallet"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { WithdrawForm } from "@/components/withdraw-form"

export const dynamic = "force-dynamic"

export default async function WithdrawPage() {
  const session = await getSession()
  if (!session?.user) redirect("/")

  const status = await getWithdrawStatus()

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Withdraw" />
      <WithdrawForm status={status} />
      <BottomNav />
    </div>
  )
}
