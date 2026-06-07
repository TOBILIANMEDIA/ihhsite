"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Dices, Ticket, ChevronRight, Sparkles, Trophy, Zap, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { claimFreeDrawSlot } from "@/app/actions/games"

type Props = {
  open: boolean
  onClose: () => void
  // Lucky draw state — passed from server so we can auto-enter
  freeSlotAvailable?: boolean
  hasActiveInvestment?: boolean
  drawOpen?: boolean
}

export function GamesPopup({
  open,
  onClose,
  freeSlotAvailable = false,
  hasActiveInvestment = false,
  drawOpen = true,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) {
      // Slight delay so CSS transition fires
      const id = setTimeout(() => setMounted(true), 10)
      return () => clearTimeout(id)
    } else {
      setMounted(false)
    }
  }, [open])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [open])

  if (!open) return null

  const handleSpin = () => {
    onClose()
    router.push("/games?tab=spin")
  }

  const handleLuckyDraw = () => {
    if (!drawOpen) {
      toast.error("Draw is already closed for today. Come back tomorrow!")
      return
    }

    // If free slot is available, auto-claim it then navigate
    if (freeSlotAvailable && hasActiveInvestment) {
      startTransition(async () => {
        const res = await claimFreeDrawSlot()
        if (res.ok) {
          toast.success("Free slot entered! Navigating to Lucky Draw...")
        }
        onClose()
        router.push("/games?tab=draw")
      })
    } else {
      onClose()
      router.push("/games?tab=draw")
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center">
      {/* Backdrop */}
      <button
        onClick={onClose}
        className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close"
      />

      {/* Sheet */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-t-[2rem] border border-border bg-card pb-safe transition-transform duration-300 ease-out ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h2 className="text-lg font-black tracking-tight">Play &amp; Earn</h2>
            </div>
            <p className="text-xs text-muted-foreground">Choose your game — win real cash</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Game cards */}
        <div className="flex flex-col gap-3 px-5 pb-6">

          {/* Stake & Spin */}
          <button
            onClick={handleSpin}
            className="group relative overflow-hidden rounded-2xl border border-amber-400/25 bg-amber-400/8 p-4 text-left transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, oklch(0.22 0.025 264) 0%, oklch(0.24 0.04 65) 100%)" }}
          >
            {/* Glow ring */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-amber-400/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Icon container */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15">
                  <Dices className="h-7 w-7 text-amber-400" />
                  {/* Pulse dot */}
                  <span className="absolute -right-1 -top-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-base text-foreground">Stake &amp; Spin</p>
                    <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      UP TO 3×
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Stake any amount, spin the wheel
                  </p>
                  {/* Multiplier pills */}
                  <div className="mt-2 flex gap-1">
                    {["1.5×", "2×", "2.5×", "3×"].map((m) => (
                      <span key={m} className="rounded-md border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400">INSTANT</span>
                </div>
              </div>
            </div>
          </button>

          {/* Lucky Draw */}
          <button
            onClick={handleLuckyDraw}
            disabled={pending}
            className="group relative overflow-hidden rounded-2xl border border-emerald-500/25 p-4 text-left transition-all active:scale-[0.98] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, oklch(0.22 0.025 264) 0%, oklch(0.24 0.05 160) 100%)" }}
          >
            {/* Glow ring */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-emerald-500/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            {/* "FREE SLOT" badge — only if available */}
            {freeSlotAvailable && hasActiveInvestment && drawOpen && (
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] font-black text-emerald-400">FREE SLOT</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Icon container */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15">
                  {pending ? (
                    <Loader2 className="h-7 w-7 text-emerald-400 animate-spin" />
                  ) : (
                    <Ticket className="h-7 w-7 text-emerald-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-base text-foreground">Lucky Draw</p>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      DAILY
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter slots, top 3 win cash prizes
                  </p>
                  {/* Prize split */}
                  <div className="mt-2 flex gap-2">
                    {[{ place: "1st", pct: "35%" }, { place: "2nd", pct: "20%" }, { place: "3rd", pct: "15%" }].map((p) => (
                      <div key={p.place} className="flex items-center gap-0.5">
                        <Trophy className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="font-mono text-[10px] font-bold text-emerald-400">{p.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400">ENTER</span>
              </div>
            </div>
          </button>

          {/* Nudge line */}
          <p className="text-center text-[11px] text-muted-foreground">
            Winnings are credited instantly to your wallet
          </p>
        </div>
      </div>
    </div>
  )
}
