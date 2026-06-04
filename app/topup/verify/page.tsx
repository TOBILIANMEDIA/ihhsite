import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { getSession } from "@/lib/session"
import { verifyDeposit } from "@/app/actions/deposit"
import { Logo } from "@/components/logo"

export const dynamic = "force-dynamic"

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/")

  const { reference } = await searchParams
  let success = false
  let message = "No payment reference found."

  if (reference) {
    try {
      const res = await verifyDeposit(reference)
      success = res.ok
      message = res.message ?? ""
    } catch {
      message = "We couldn't verify your payment. Contact support if you were charged."
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-6 h-14 w-14" />
      {success ? (
        <CheckCircle2 className="h-20 w-20 text-success" />
      ) : (
        <XCircle className="h-20 w-20 text-destructive" />
      )}
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
        {success ? "Payment Successful" : "Payment Not Completed"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground text-pretty">{message}</p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/dashboard"
          className="rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
        >
          Go to Dashboard
        </Link>
        {!success && (
          <Link
            href="/topup"
            className="rounded-2xl border border-border bg-secondary py-3.5 text-sm font-bold text-secondary-foreground"
          >
            Try Again
          </Link>
        )}
      </div>
    </div>
  )
}
