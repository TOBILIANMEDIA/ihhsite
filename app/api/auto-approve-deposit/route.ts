import { db } from "@/lib/db"
import { deposit, wallet, transaction, bankAccount } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

// Internal secret to verify requests come from our own code
const AUTO_APPROVE_SECRET = process.env.AUTO_APPROVE_SECRET ?? "cil_auto_approve_internal_secret"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { reference, email, secret } = body

    console.log("[v0] Auto-approve request received for:", email, reference)

    // Validate secret
    if (secret !== AUTO_APPROVE_SECRET) {
      console.error("[v0] Invalid auto-approve secret")
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 })
    }

    if (!reference) {
      return new Response(JSON.stringify({ ok: false, error: "Missing reference" }), { status: 400 })
    }

    // Sleep for 3 seconds
    console.log("[v0] Sleeping 3 seconds before approval...")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    console.log("[v0] Woke up, proceeding with auto-approval for:", reference)

    // Get the deposit
    const [dep] = await db.select().from(deposit).where(eq(deposit.reference, reference))

    if (!dep) {
      console.error("[v0] Deposit not found:", reference)
      return new Response(JSON.stringify({ ok: false, error: "Deposit not found" }), { status: 404 })
    }

    console.log("[v0] Found deposit:", { reference, userId: dep.userId, amount: dep.amount, status: dep.status })

    // Only auto-approve if still in processing state
    if (dep.status !== "processing") {
      console.log("[v0] Deposit already processed or not in processing state:", dep.status)
      return new Response(
        JSON.stringify({ ok: true, message: "Already processed" }),
        { status: 200 }
      )
    }

    const amount = Number(dep.amount)

    // Update deposit to success
    await db.update(deposit).set({ status: "success" }).where(eq(deposit.reference, reference))
    console.log("[v0] Updated deposit status to success")

    // Check if wallet exists
    const [w] = await db.select().from(wallet).where(eq(wallet.userId, dep.userId))
    if (!w) {
      console.error("[v0] Wallet not found for userId:", dep.userId)
      return new Response(JSON.stringify({ ok: false, error: "Wallet not found" }), { status: 404 })
    }
    console.log("[v0] Found wallet, current balance:", w.balance)

    // Credit wallet
    const result = await db
      .update(wallet)
      .set({
        balance: sql`${wallet.balance} + ${amount}`,
        totalDeposited: sql`${wallet.totalDeposited} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallet.userId, dep.userId))
    
    console.log("[v0] Updated wallet, result:", result)

    // Create transaction record
    await db.insert(transaction).values({
      userId: dep.userId,
      type: "deposit",
      amount: String(amount),
      status: "completed",
      reference,
      description: `Auto-approved deposit: ₦${amount.toLocaleString()}`,
    })

    // Update bank account stats
    if (dep.bankAccountId) {
      await db
        .update(bankAccount)
        .set({
          totalDeposits: sql`${bankAccount.totalDeposits} + ${amount}`,
          depositCount: sql`${bankAccount.depositCount} + 1`,
        })
        .where(eq(bankAccount.id, dep.bankAccountId))
    }

    console.log("[v0] Auto-approval completed successfully for:", reference)
    return new Response(
      JSON.stringify({ ok: true, message: "Deposit auto-approved", amount }),
      { status: 200 }
    )
  } catch (err) {
    console.error("[v0] Auto-approve error:", err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}
