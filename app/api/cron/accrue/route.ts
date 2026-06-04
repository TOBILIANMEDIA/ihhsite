import { accrueIncomeForAll } from "@/lib/income-engine"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  // Optional protection: set CRON_SECRET and Vercel Cron will send it.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
  const result = await accrueIncomeForAll()
  return NextResponse.json({ ok: true, ...result })
}
