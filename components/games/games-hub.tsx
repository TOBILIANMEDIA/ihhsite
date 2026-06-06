"use client"

import { useState } from "react"
import { Dices, Ticket, Lock } from "lucide-react"
import { StakeSpinGame } from "./stake-spin"
import { LuckyDrawGame } from "./lucky-draw"
import { LockVaultGame } from "./lock-vault"

type Tab = "spin" | "draw" | "vault"

type Vault = {
  id: number
  amount: string | number
  lockDays: number
  bonusPercent: string | number
  bonusAmount: string | number
  status: string
  unlocksAt: Date | string
  createdAt: Date | string
}

type Round = {
  drawDate: string
  prizePool: string | number
  status: string
} | null

type Props = {
  balance: number
  activeInvestments: number
  today: string
  round: Round
  todaySlotsCount: number
  freeSlotsTotal: number
  vaults: Vault[]
  features: { stakeAndSpin: boolean; luckyDraw: boolean; lockVault: boolean }
  vaultTiers: { days: number; bonusPercent: number; penaltyPercent: number }[]
  stakeMin: number
  stakeMax: number
  slotCost: number
}

const TABS: { id: Tab; label: string; icon: typeof Dices; feature: keyof Props["features"] }[] = [
  { id: "spin", label: "Stake & Spin", icon: Dices, feature: "stakeAndSpin" },
  { id: "draw", label: "Lucky Draw", icon: Ticket, feature: "luckyDraw" },
  { id: "vault", label: "Lock Vault", icon: Lock, feature: "lockVault" },
]

export function GamesHub(props: Props) {
  const { balance, features } = props
  const enabledTabs = TABS.filter((t) => features[t.feature])
  const [tab, setTab] = useState<Tab>(enabledTabs[0]?.id ?? "spin")

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div>
            <h1 className="text-base font-bold tracking-tight">Games</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Balance: ₦{balance.toLocaleString()}
            </p>
          </div>
          <div className="flex h-7 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-bold text-primary">LIVE</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-5">
        {/* Tab switcher */}
        <div className="mb-5 flex gap-2 rounded-2xl border border-border bg-card p-1.5">
          {enabledTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "spin" && <StakeSpinGame balance={balance} stakeMin={props.stakeMin} stakeMax={props.stakeMax} />}
        {tab === "draw" && (
          <LuckyDrawGame
            balance={balance}
            today={props.today}
            round={props.round}
            todaySlotsCount={props.todaySlotsCount}
            freeSlotsTotal={props.freeSlotsTotal}
            activeInvestments={props.activeInvestments}
            slotCost={props.slotCost}
          />
        )}
        {tab === "vault" && (
          <LockVaultGame
            balance={balance}
            vaults={props.vaults}
            tiers={props.vaultTiers}
          />
        )}
      </div>
    </div>
  )
}
