import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthScreen } from "@/components/auth-screen"

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const session = await getSession()
  if (session?.user) redirect("/dashboard")
  const { ref } = await searchParams
  return <AuthScreen defaultInvite={ref ?? ""} />
}
