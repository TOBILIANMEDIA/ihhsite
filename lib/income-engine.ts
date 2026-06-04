import { db } from "@/lib/db"
import { investment, wallet, transaction } from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Accrues daily income for all of a user's active investments.
 * Pays one daily portion for every full 24h elapsed since the last payout,
 * capped at the plan's duration. Completes the investment when fully paid.
 *
 * This runs on read (when a user opens their dashboard) AND can be triggered
 * by the cron endpoint, so balances stay accurate even when offline.
 */
export async function accrueIncomeForUser(userId: string): Promise<number> {
  const actives = await db
    .select()
    .from(investment)
    .where(and(eq(investment.userId, userId), eq(investment.status, "active")))

  let totalCredited = 0
  const now = Date.now()

  for (const inv of actives) {
    const daily = Number(inv.dailyEarning)
    const duration = inv.durationDays
    const daysPaid = inv.daysPaid
    const last = new Date(inv.lastPayoutAt).getTime()

    const elapsedDays = Math.floor((now - last) / DAY_MS)
    if (elapsedDays <= 0) continue

    const remainingDays = duration - daysPaid
    const payDays = Math.min(elapsedDays, remainingDays)
    if (payDays <= 0) {
      if (remainingDays <= 0) {
        await db.update(investment).set({ status: "completed" }).where(eq(investment.id, inv.id))
      }
      continue
    }

    const credit = daily * payDays
    const newDaysPaid = daysPaid + payDays
    const newStatus = newDaysPaid >= duration ? "completed" : "active"
    // advance lastPayoutAt by the number of full days paid
    const newLast = new Date(last + payDays * DAY_MS)

    await db
      .update(investment)
      .set({
        daysPaid: newDaysPaid,
        amountEarned: sql`${investment.amountEarned} + ${credit}`,
        lastPayoutAt: newLast,
        status: newStatus,
      })
      .where(eq(investment.id, inv.id))

    await db
      .update(wallet)
      .set({
        balance: sql`${wallet.balance} + ${credit}`,
        totalEarned: sql`${wallet.totalEarned} + ${credit}`,
        updatedAt: new Date(),
      })
      .where(eq(wallet.userId, userId))

    await db.insert(transaction).values({
      userId,
      type: "earning",
      amount: String(credit),
      description: `Daily income from ${inv.planName} (${payDays} day${payDays > 1 ? "s" : ""})`,
    })

    totalCredited += credit
  }

  return totalCredited
}

/** Accrues income for every user with active investments. Used by cron. */
export async function accrueIncomeForAll(): Promise<{ users: number; credited: number }> {
  const rows = await db
    .selectDistinct({ userId: investment.userId })
    .from(investment)
    .where(eq(investment.status, "active"))

  let credited = 0
  for (const r of rows) {
    credited += await accrueIncomeForUser(r.userId)
  }
  return { users: rows.length, credited }
}
