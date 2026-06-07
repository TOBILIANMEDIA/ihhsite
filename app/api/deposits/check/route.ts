"use server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bankAccount, deposit, wallet, transaction } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { getSession } from "@/lib/session"

/**
 * GET /api/deposits/check?reference=IHH_xxx
 *
 * Called by the deposit page every 3 minutes to check if Sabuss has received
 * the payment. Uses the Sabuss Query/Fetch Transaction API:
 *   POST https://sabuss.com/vtu/api/query/{API_KEY}
 *   body: { reference: "..." }   (or fetches last transactions and scans them)
 *
 * Returns:
 *   { status: "approved" }  — payment found, wallet credited
 *   { status: "pending" }   — not found yet
 *   { status: "expired" }   — deposit expired, now cancelled
 *   { status: "no_api_key" } — account has no Sabuss key, manual only
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const reference = req.nextUrl.searchParams.get("reference")
  if (!reference) return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 400 })

  const [dep] = await db.select().from(deposit).where(eq(deposit.reference, reference))
  if (!dep || dep.userId !== userId) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
  }

  // Already resolved — no need to hit Sabuss at all
  if (dep.status === "success" || dep.status === "approved") {
    return NextResponse.json({ ok: true, status: "approved", message: "Deposit already confirmed" })
  }
  if (dep.status === "failed" || dep.status === "rejected") {
    return NextResponse.json({ ok: true, status: "cancelled" })
  }

  const now = new Date()

  // Auto-cancel if expired
  if (dep.expiresAt && now > new Date(dep.expiresAt)) {
    if (["pending", "processing"].includes(dep.status)) {
      await db.update(deposit).set({ status: "failed" }).where(eq(deposit.reference, reference))
    }
    return NextResponse.json({ ok: true, status: "expired" })
  }

  // If no Sabuss account assigned, can't poll
  if (!dep.bankAccountId) {
    return NextResponse.json({ ok: true, status: "no_api_key", message: "No account assigned" })
  }

  const [acc] = await db.select().from(bankAccount).where(eq(bankAccount.id, dep.bankAccountId))
  if (!acc?.sabussApiKey) {
    return NextResponse.json({ ok: true, status: "no_api_key", message: "Manual approval only — no Sabuss key on this account" })
  }

  if (!acc.sabussPin) {
    return NextResponse.json({ ok: true, status: "no_api_key", message: "No Sabuss PIN set — contact admin" })
  }

  // Sabuss query API: POST form-encoded with pin + reference
  let sabussData: Record<string, unknown> | null = null
  try {
    const formBody = new URLSearchParams()
    formBody.append("pin", acc.sabussPin)
    formBody.append("reference", reference)

    const res = await fetch(`https://sabuss.com/vtu/api/query/${acc.sabussApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    try { sabussData = JSON.parse(text) } catch { /* not JSON */ }
  } catch {
    return NextResponse.json({ ok: true, status: "pending", message: "Could not reach Sabuss API" })
  }

  if (!sabussData) {
    return NextResponse.json({ ok: true, status: "pending", message: "Sabuss returned invalid response" })
  }

  const sabussStatus = String(sabussData.status ?? "").toLowerCase()
  const sabussResponse = sabussData.response

  // Sabuss returns status:"error" if not found or invalid
  if (sabussStatus !== "success") {
    return NextResponse.json({
      ok: true,
      status: "pending",
      message: "Payment not found yet — will check again in 3 minutes",
      checkedAt: new Date().toISOString(),
    })
  }

  // Transaction found
  const tx: Record<string, unknown> = Array.isArray(sabussResponse)
    ? sabussResponse[0]
    : (sabussResponse as Record<string, unknown>) ?? {}

  const depositAmount = Math.round(Number(dep.amount))

  // Soft name check
  if (dep.senderName && (tx.sender || tx.account_name)) {
    const stored = dep.senderName.toLowerCase()
    const incoming = String(tx.sender ?? tx.account_name ?? "").toLowerCase()
    const parts = stored.split(/\s+/)
    const nameOk = parts.some((p) => p.length > 1 && incoming.includes(p))
    if (!nameOk) {
      await db.update(deposit).set({ status: "needs_review" }).where(eq(deposit.reference, reference))
      return NextResponse.json({ ok: true, status: "needs_review", message: "Payment found but sender name mismatch — flagged for admin review" })
    }
  }

  const matchedTransaction = tx

  // Found a match — auto-approve.
  // Always credit the full depositAmount the user intended, not the Sabuss net amount.
  await db.update(deposit).set({
    status: "success",
    senderName: dep.senderName ?? (matchedTransaction.sender ? String(matchedTransaction.sender) : dep.senderName),
  }).where(eq(deposit.reference, reference))

  await db.update(wallet).set({
    balance: sql`${wallet.balance} + ${depositAmount}`,
    totalDeposited: sql`${wallet.totalDeposited} + ${depositAmount}`,
    updatedAt: new Date(),
  }).where(eq(wallet.userId, userId))

  await db.insert(transaction).values({
    userId,
    type: "deposit",
    amount: String(depositAmount),
    status: "completed",
    reference,
    description: `Auto-approved via Sabuss poll. Sender: ${matchedTransaction.sender ?? "unknown"}`,
  })

  await db.update(bankAccount).set({
    totalDeposits: sql`${bankAccount.totalDeposits} + ${depositAmount}`,
    depositCount: sql`${bankAccount.depositCount} + 1`,
  }).where(eq(bankAccount.id, dep.bankAccountId))

  return NextResponse.json({ ok: true, status: "approved" })
}
