"use server"

import { db } from "@/lib/db"
import { wallet, withdrawal, transaction, giftCode, giftCodeRedemption, profile, investment } from "@/lib/db/schema"
import { SITE } from "@/lib/plans"
import { getUserId } from "@/lib/session"
import { getBoolSetting, SETTING_KEYS } from "@/app/actions/settings"
import { and, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const WITHDRAWAL_OPEN_HOUR  = 9   // 9 AM  Nigeria time (UTC+1)
const WITHDRAWAL_CLOSE_HOUR = 17  // 5 PM  Nigeria time
const COOLDOWN_MS = 23 * 60 * 60 * 1000 // 23 hours

/** Returns Nigeria local hour (0-23) regardless of server timezone. */
function nigeriaHour(): number {
  const now = new Date()
  // Nigeria is UTC+1 year-round (no DST)
  const nigeriaMs = now.getTime() + 60 * 60 * 1000
  return new Date(nigeriaMs).getUTCHours()
}

function isWithinWindow(): boolean {
  const h = nigeriaHour()
  return h >= WITHDRAWAL_OPEN_HOUR && h < WITHDRAWAL_CLOSE_HOUR
}

/**
 * Returns the full withdrawal eligibility status for the current user.
 * Used by the WithdrawForm UI to show the right blocked state.
 */
export async function getWithdrawStatus() {
  const userId = await getUserId()
  const [w] = await db.select().from(wallet).where(eq(wallet.userId, userId))
  const [lastWd] = await db
    .select()
    .from(withdrawal)
    .where(eq(withdrawal.userId, userId))
    .orderBy(desc(withdrawal.createdAt))
    .limit(1)

  const hasDeposited = Number(w?.totalDeposited ?? 0) > 0
  const invRows = hasDeposited
    ? await db.select({ id: investment.id }).from(investment).where(eq(investment.userId, userId)).limit(1)
    : []
  const hasInvested = invRows.length > 0

  // Cooldown: based on the last withdrawal's createdAt
  const lastWdAt = lastWd?.createdAt ? new Date(lastWd.createdAt).getTime() : null
  const cooldownEndsAt = lastWdAt ? lastWdAt + COOLDOWN_MS : null
  const now = Date.now()
  const onCooldown = cooldownEndsAt !== null && now < cooldownEndsAt
  const cooldownRemainingMs = onCooldown ? cooldownEndsAt! - now : 0

  // Window: next open time (in ms from now)
  const h = nigeriaHour()
  let windowOpensMs = 0
  if (!isWithinWindow()) {
    // how many ms until 9 AM Nigeria next?
    const minutesUntilOpen = h < WITHDRAWAL_OPEN_HOUR
      ? (WITHDRAWAL_OPEN_HOUR - h) * 60
      : (24 - h + WITHDRAWAL_OPEN_HOUR) * 60
    windowOpensMs = minutesUntilOpen * 60 * 1000
  }

  return {
    balance: Number(w?.balance ?? 0),
    frozenBalance: Number(w?.frozenBalance ?? 0),
    hasDeposited,
    hasInvested,
    withinWindow: isWithinWindow(),
    windowOpensMs,
    onCooldown,
    cooldownRemainingMs,
    lastWithdrawalAt: lastWd?.createdAt ?? null,
  }
}

export async function requestWithdrawal(data: {
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
}) {
  const userId = await getUserId()
  const amount = Number(data.amount)

  // Respect global withdrawal pause
  if (await getBoolSetting(SETTING_KEYS.withdrawalsPaused)) {
    return { ok: false, message: "Network error. Please try again later." }
  }

  // Time window check
  if (!isWithinWindow()) {
    return { ok: false, message: `Withdrawals are only available ${SITE.withdrawalHours}.` }
  }

  // Must have deposited and invested
  const [w] = await db.select().from(wallet).where(eq(wallet.userId, userId))
  const hasDeposited = Number(w?.totalDeposited ?? 0) > 0
  if (!hasDeposited) {
    return { ok: false, message: "You need to make a deposit before you can withdraw." }
  }
  const invRows = await db
    .select({ id: investment.id })
    .from(investment)
    .where(eq(investment.userId, userId))
    .limit(1)
  if (invRows.length === 0) {
    return { ok: false, message: "You need an active investment plan before withdrawing." }
  }

  // 23-hour cooldown check
  const [lastWd] = await db
    .select()
    .from(withdrawal)
    .where(eq(withdrawal.userId, userId))
    .orderBy(desc(withdrawal.createdAt))
    .limit(1)
  if (lastWd?.createdAt) {
    const elapsed = Date.now() - new Date(lastWd.createdAt).getTime()
    if (elapsed < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - elapsed
      const h = Math.floor(remaining / 3600000)
      const m = Math.floor((remaining % 3600000) / 60000)
      return { ok: false, message: `You can only withdraw once per day. Try again in ${h}h ${m}m.` }
    }
  }

  if (!amount || amount < SITE.minWithdrawal) {
    return { ok: false, message: `Minimum withdrawal is ₦${SITE.minWithdrawal.toLocaleString()}` }
  }
  if (!data.bankName || !data.accountNumber || !data.accountName) {
    return { ok: false, message: "Please fill in your bank details" }
  }

  const balance = Number(w?.balance ?? 0)
  if (balance < amount) {
    return { ok: false, message: "Insufficient balance" }
  }

  const charge = Math.round((amount * SITE.withdrawalCharge) / 100)
  const net = amount - charge

  // Hold the funds immediately
  await db
    .update(wallet)
    .set({
      balance: sql`${wallet.balance} - ${amount}`,
      lastWithdrawalAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(wallet.userId, userId))

  await db.insert(withdrawal).values({
    userId,
    amount: String(amount),
    charge: String(charge),
    netAmount: String(net),
    bankName: data.bankName,
    accountNumber: data.accountNumber,
    accountName: data.accountName,
    status: "pending",
  })

  // Save bank details for next time
  await db
    .update(profile)
    .set({
      savedBankName: data.bankName,
      savedAccountNumber: data.accountNumber,
      savedAccountName: data.accountName,
    })
    .where(eq(profile.userId, userId))

  await db.insert(transaction).values({
    userId,
    type: "withdrawal",
    amount: String(amount),
    status: "pending",
    description: `Withdrawal request (₦${charge.toLocaleString()} fee, ₦${net.toLocaleString()} net)`,
  })

  revalidatePath("/")
  revalidatePath("/withdraw")
  return {
    ok: true,
    message: `Withdrawal of ₦${amount.toLocaleString()} submitted. You'll receive ₦${net.toLocaleString()} after approval.`,
  }
}

export async function getSavedBankDetails() {
  const userId = await getUserId()
  const [p] = await db.select().from(profile).where(eq(profile.userId, userId))
  if (!p) return null
  return {
    savedBankName: p.savedBankName,
    savedAccountNumber: p.savedAccountNumber,
    savedAccountName: p.savedAccountName,
  }
}

export async function redeemGiftCode(code: string) {
  const userId = await getUserId()
  const clean = code.trim().toUpperCase()
  if (!clean) return { ok: false, message: "Enter a gift code" }

  const [gc] = await db.select().from(giftCode).where(eq(giftCode.code, clean))
  if (!gc || !gc.active) return { ok: false, message: "Invalid or expired gift code" }
  if (gc.uses >= gc.maxUses) return { ok: false, message: "This gift code has been fully used" }

  // prevent double redemption by same user
  const prior = await db
    .select()
    .from(giftCodeRedemption)
    .where(and(eq(giftCodeRedemption.userId, userId), eq(giftCodeRedemption.giftCodeId, gc.id)))
  if (prior.length > 0) return { ok: false, message: "You already redeemed this code" }

  const amount = Number(gc.amount)
  await db.update(giftCode).set({ uses: sql`${giftCode.uses} + 1` }).where(eq(giftCode.id, gc.id))
  await db.insert(giftCodeRedemption).values({
    userId,
    giftCodeId: gc.id,
    code: clean,
    amount: String(amount),
  })
  await db
    .update(wallet)
    .set({
      balance: sql`${wallet.balance} + ${amount}`,
      totalEarned: sql`${wallet.totalEarned} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallet.userId, userId))
  await db.insert(transaction).values({
    userId,
    type: "bonus",
    amount: String(amount),
    description: `Gift code redeemed: ${clean}`,
  })

  revalidatePath("/")
  return { ok: true, message: `You received ₦${amount.toLocaleString()} from gift code!` }
}
