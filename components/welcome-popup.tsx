'use client'

import { useState, useEffect } from 'react'
import { X, Send, MessageCircle, ArrowRight, Layers, TrendingUp, Wallet } from 'lucide-react'
import { SITE, formatNaira } from '@/lib/plans'
import { Logo } from '@/components/logo'
import { getTelegramConfig } from '@/app/actions/system-config'
import type { TelegramConfig } from '@/app/actions/system-config'

export function WelcomePopup() {
  const [show, setShow] = useState(false)
  const [tg, setTg] = useState<TelegramConfig | null>(null)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('cil_welcome_seen')
    if (!hasSeenWelcome) {
      setShow(true)
      localStorage.setItem('cil_welcome_seen', 'true')
    }
    getTelegramConfig().then(setTg)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <button
        onClick={() => setShow(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-sm rounded-t-3xl border-t border-x border-border/60 bg-card pb-safe sm:rounded-2xl sm:border shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Close */}
        <button
          onClick={() => setShow(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pt-4 pb-6">
          {/* Brand header */}
          <div className="mb-5 flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <div>
              <h2 className="text-lg font-bold leading-tight">Welcome to {SITE.name}</h2>
              <p className="text-xs text-muted-foreground">{formatNaira(SITE.welcomeBonus)} bonus added to your wallet</p>
            </div>
          </div>

          {/* Bonus badge */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/25 bg-success/8 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15">
              <Wallet className="h-4.5 w-4.5 text-success" />
            </div>
            <div>
              <p className="text-sm font-bold text-success">{formatNaira(SITE.welcomeBonus)} Welcome Bonus</p>
              <p className="text-[11px] text-muted-foreground">Credited to your wallet instantly</p>
            </div>
          </div>

          {/* Steps */}
          <div className="mb-4 flex flex-col gap-2">
            {[
              { icon: Layers,      label: 'Pick a project tier',    sub: 'Foundation → Skyline',           tint: 'text-primary',    bg: 'bg-primary/10'  },
              { icon: TrendingUp,  label: 'Earn daily returns',     sub: `${SITE.investmentBonusPercent}% instant bonus + 30-day income`, tint: 'text-success',    bg: 'bg-success/10'  },
              { icon: Wallet,      label: 'Withdraw anytime',       sub: 'Fast payout to your bank',       tint: 'text-amber-500',  bg: 'bg-amber-400/10' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.tint}`} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <button
            onClick={() => setShow(false)}
            className="group relative mb-2.5 flex w-full items-center justify-center overflow-hidden rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/35 active:translate-y-0 active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            <span className="flex items-center gap-2">
              Start Building Returns
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <div className="flex gap-2">
            <a
              href={tg?.channelLink ?? SITE.telegramChannel}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-secondary/50 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Send className="h-3.5 w-3.5 text-[#0088cc]" /> Channel
            </a>
            <a
              href={tg?.supportUsername ? `https://t.me/${tg.supportUsername.replace(/^@/, "")}` : `https://t.me/${SITE.telegramSupport}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-secondary/50 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <MessageCircle className="h-3.5 w-3.5 text-[#0088cc]" /> Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
