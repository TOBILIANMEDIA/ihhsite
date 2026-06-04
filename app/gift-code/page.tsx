import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { GiftCodeForm } from "@/components/gift-code-form"

export const dynamic = "force-dynamic"

export default async function GiftCodePage() {
  const session = await getSession()
  if (!session?.user) redirect("/")

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Gift Code" />
      <GiftCodeForm />
      <BottomNav />
    </div>
  )
}
