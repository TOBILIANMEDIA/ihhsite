import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AppHeader } from '@/components/app-header'
import { BottomNav } from '@/components/bottom-nav'
import { PlanCard } from '@/components/plan-card'
import { PLANS, formatNaira } from '@/lib/plans'

export const dynamic = 'force-dynamic'

const TIER_GROUPS = [
  { phase: 'Foundation', ids: [1, 2, 3], desc: 'Entry-level construction projects. Build your foundation.' },
  { phase: 'Structure',  ids: [4, 5, 6], desc: 'Mid-tier structural builds with higher daily returns.' },
  { phase: 'Framework',  ids: [7, 8, 9], desc: 'Advanced framework projects for serious investors.' },
  { phase: 'Skyline',    ids: [10, 11, 12], desc: 'Premium skyline developments. Maximum returns.' },
]

export default async function ProductsPage() {
  const session = await getSession()
  if (!session?.user) redirect('/')

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Investment Projects" />

      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-5">
        {/* Summary table */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">Project Overview</h2>
            <p className="text-[11px] text-muted-foreground">All plans run 30 days · returns paid every 24h</p>
          </div>
          <div className="grid grid-cols-4 border-b border-border/60 bg-secondary/30 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {["Phase", "Capital", "Daily", "Total"].map((h) => (
              <div key={h} className="py-2.5">{h}</div>
            ))}
          </div>
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`grid grid-cols-4 text-center text-xs tabular-nums ${
                i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'
              } ${i !== PLANS.length - 1 ? 'border-b border-border/40' : ''}`}
            >
              <div className="px-2 py-2.5 text-left text-[10px] font-semibold text-primary">{plan.name.split(' ').slice(-1)[0]}</div>
              <div className="px-1 py-2.5 text-[11px]">{(plan.price / 1000).toFixed(0)}k</div>
              <div className="px-1 py-2.5 text-[11px] font-semibold text-success">{(plan.daily / 1000).toFixed(1)}k</div>
              <div className="px-1 py-2.5 text-[11px]">{(plan.total / 1000).toFixed(0)}k</div>
            </div>
          ))}
        </section>

        {/* Tier groups */}
        {TIER_GROUPS.map((group) => {
          const plans = PLANS.filter((p) => group.ids.includes(p.id))
          return (
            <section key={group.phase}>
              <div className="mb-3">
                <h2 className="text-base font-bold">{group.phase} Tier</h2>
                <p className="text-[11px] text-muted-foreground">{group.desc}</p>
              </div>
              <div className="flex flex-col gap-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </section>
          )
        })}

        <p className="px-1 text-center text-xs text-muted-foreground">
          Min. deposit {formatNaira(PLANS[0].price)} · Returns drop every 24 hours
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
