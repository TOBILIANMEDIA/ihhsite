import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountNumber = searchParams.get("account_number")
  const bankCode = searchParams.get("bank_code")

  if (!accountNumber || !bankCode) {
    return NextResponse.json({ error: "account_number and bank_code are required" }, { status: 400 })
  }

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    // Paystack key not configured — return a graceful no-op so the form still works manually
    return NextResponse.json({ error: "Bank verification not configured" }, { status: 503 })
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        // Don't cache — always live
        cache: "no-store",
      },
    )
    const json = await res.json()
    if (!res.ok || !json.status) {
      return NextResponse.json({ error: json.message ?? "Could not resolve account" }, { status: 400 })
    }
    return NextResponse.json({ accountName: json.data.account_name })
  } catch {
    return NextResponse.json({ error: "Lookup failed — check your network" }, { status: 500 })
  }
}
