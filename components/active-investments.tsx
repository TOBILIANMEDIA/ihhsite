import { formatNaira } from "@/lib/plans"

type Inv = {
  id: number
  planName: string
  dailyEarning: string
  amountEarned: string
  totalEarning: string
  daysPaid: number
  durationDays: number
  status: string
}

export function ActiveInvestments({ investments }: { investments: Inv[] }) {
  if (investments.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold tracking-tight">My Investments</h2>
      <div className="flex flex-col gap-3">
        {investments.map((inv) => {
          const pct = Math.min(100, Math.round((inv.daysPaid / inv.durationDays) * 100))
          return (
            <article key={inv.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{inv.planName}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    inv.status === "active"
                      ? "bg-success/15 text-success"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Daily <span className="font-semibold text-success">{formatNaira(Number(inv.dailyEarning))}</span>
                </span>
                <span className="text-muted-foreground">
                  Earned <span className="font-semibold text-foreground">{formatNaira(Number(inv.amountEarned))}</span>
                </span>
              </div>
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {inv.daysPaid}/{inv.durationDays} days · {formatNaira(Number(inv.totalEarning))} total
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
