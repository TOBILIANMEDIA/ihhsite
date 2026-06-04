"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Gift, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { redeemGiftCode } from "@/app/actions/wallet"

export function GiftCodeForm() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [pending, startTransition] = useTransition()

  function handleRedeem() {
    if (!code.trim()) {
      toast.error("Enter a gift code")
      return
    }
    startTransition(async () => {
      const res = await redeemGiftCode(code)
      if (res.ok) {
        toast.success(res.message)
        setCode("")
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Redeem Gift Code</h1>
      </div>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-gradient-to-br from-pink-400/20 via-card to-card p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-400/15">
          <Gift className="h-8 w-8 text-pink-400" />
        </span>
        <p className="text-sm text-muted-foreground text-pretty">
          Enter a valid gift code below to instantly credit your wallet. Daily gift codes are shared in our Telegram
          channel.
        </p>
      </section>

      <div className="rounded-2xl border border-border bg-secondary/50 px-4 focus-within:border-primary">
        <input
          placeholder="ENTER GIFT CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full bg-transparent py-4 text-center font-mono text-lg font-bold tracking-widest outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground"
        />
      </div>

      <button
        onClick={handleRedeem}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-5 w-5 animate-spin" />}
        Redeem Code
      </button>
    </main>
  )
}
