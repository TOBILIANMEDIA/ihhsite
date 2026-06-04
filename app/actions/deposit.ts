"use server"

import { db } from "@/lib/db"
import { deposit, wallet, transaction, user as userTable } from "@/lib/db/schema"
import { SITE } from "@/lib/plans"
import { getUserId } from "@/lib/session"
import { paystackConfigured, paystackInit, paystackVerify } from "@/lib/paystack"
import { eq, sql } from "drizzle-orm"

function baseUrl() {
  return (
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL) ?? "http://localhost:3000"
  )
}

export async function startDeposit(amount: number) {
  const userId = await getUserId()
  const amt = Math.floor(Number(amount))
  if (!amt || amt < SITE.minDeposit) {
    return { ok: false, message: `Minimum deposit is ₦${SITE.minDeposit.toLocaleString()}` }
  }
  if (!paystackConfigured()) {
    return {
      ok: false,
      message: "Payments are not yet configured. Please contact support to add your Paystack keys.",
    }
  }

  const [u] = await db.select().from(userTable).where(eq(userTable.id, userId))
  const reference = `IHH_${userId.slice(0, 8)}_${Date.now()}`

  await db.insert(deposit).values({
    userId,
    amount: String(amt),
    reference,
    status: "pending",
  })

  const init = await paystackInit({
    email: u?.email ?? "user@incomehenryhub.com",
    amountKobo: amt * 100,
    reference,
    callbackUrl: `${baseUrl()}/topup/verify?reference=${reference}`,
    metadata: { userId },
  })

  return { ok: true, url: init.authorization_url }
}

/** Verifies a Paystack transaction and credits the wallet exactly once. */
export async function verifyDeposit(reference: string) {
  const userId = await getUserId()
  const [dep] = await db.select().from(deposit).where(eq(deposit.reference, reference))
  if (!dep || dep.userId !== userId) return { ok: false, message: "Deposit not found" }
  if (dep.status === "success") return { ok: true, message: "Deposit already credited", amount: Number(dep.amount) }

  const data = await paystackVerify(reference)
  if (data.status !== "success") {
    await db.update(deposit).set({ status: "failed" }).where(eq(deposit.reference, reference))
    return { ok: false, message: "Payment was not successful" }
  }

  const amount = data.amount / 100
  await db.update(deposit).set({ status: "success" }).where(eq(deposit.reference, reference))

  // credit wallet
  await db
    .update(wallet)
    .set({
      balance: sql`${wallet.balance} + ${amount}`,
      totalDeposited: sql`${wallet.totalDeposited} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallet.userId, userId))

  await db.insert(transaction).values({
    userId,
    type: "deposit",
    amount: String(amount),
    status: "completed",
    reference,
    description: "Wallet top-up via Paystack",
  })

  return { ok: true, message: `₦${amount.toLocaleString()} added to your wallet`, amount }
}
