"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Loader2, ChevronDown, Search, CheckCircle2,
  AlertCircle, ShieldCheck, Clock, X, Lock, Snowflake, Ban,
} from "lucide-react"
import { toast } from "sonner"
import { SITE, formatNaira } from "@/lib/plans"
import { requestWithdrawal, getSavedBankDetails } from "@/app/actions/wallet"
import { cn } from "@/lib/utils"

const NIGERIAN_BANKS = [
  { name: "Access Bank",                     code: "044"    },
  { name: "Citibank Nigeria",                code: "023"    },
  { name: "Ecobank Nigeria",                 code: "050"    },
  { name: "Fidelity Bank",                   code: "070"    },
  { name: "First Bank of Nigeria",           code: "011"    },
  { name: "First City Monument Bank (FCMB)", code: "214"    },
  { name: "Globus Bank",                     code: "00103"  },
  { name: "Guaranty Trust Bank (GTB)",       code: "058"    },
  { name: "Heritage Bank",                   code: "030"    },
  { name: "Jaiz Bank",                       code: "301"    },
  { name: "Keystone Bank",                   code: "082"    },
  { name: "Kuda Bank",                       code: "50211"  },
  { name: "Moniepoint Microfinance Bank",    code: "50515"  },
  { name: "OPay (PayCom)",                   code: "999992" },
  { name: "Palmpay",                         code: "999991" },
  { name: "Polaris Bank",                    code: "076"    },
  { name: "Providus Bank",                   code: "101"    },
  { name: "Stanbic IBTC Bank",               code: "221"    },
  { name: "Standard Chartered Bank",         code: "068"    },
  { name: "Sterling Bank",                   code: "232"    },
  { name: "SunTrust Bank",                   code: "100"    },
  { name: "Titan Trust Bank",                code: "102"    },
  { name: "Union Bank",                      code: "032"    },
  { name: "United Bank for Africa (UBA)",    code: "033"    },
  { name: "Unity Bank",                      code: "215"    },
  { name: "VFD Microfinance Bank",           code: "566"    },
  { name: "Wema Bank",                       code: "035"    },
  { name: "Zenith Bank",                     code: "057"    },
] as const

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0s"
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ── Bank picker sheet ─────────────────────────────────────────────────────────

function BankPicker({
  value,
  onSelect,
  onClose,
}: {
  value: string
  onSelect: (bank: { name: string; code: string }) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = NIGERIAN_BANKS.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-modal>
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground transition-all hover:text-foreground active:scale-95">
          <X className="h-4 w-4" />
        </button>
        <h2 className="flex-1 text-base font-bold">Select Bank</h2>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 focus-within:border-primary/50 transition-colors">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bank..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No bank found</p>
        ) : (
          <ul>
            {filtered.map((bank) => (
              <li key={bank.code}>
                <button
                  onClick={() => { onSelect(bank); onClose() }}
                  className={cn("flex w-full items-center justify-between px-4 py-3.5 text-left transition-all hover:bg-secondary/50 active:bg-secondary", value === bank.name && "bg-primary/8")}
                >
                  <span className="text-sm font-medium text-foreground">{bank.name}</span>
                  {value === bank.name && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Block card ────────────────────────────────────────────────────────────────

function BlockCard({
  icon: Icon,
  color,
  bg,
  border,
  title,
  body,
  countdown,
}: {
  icon: React.ElementType
  color: string
  bg: string
  border: string
  title: string
  body: string
  countdown?: string
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl border px-5 py-6 text-center", bg, border)}>
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", bg, color)}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className={cn("text-sm font-bold", color)}>{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      </div>
      {countdown && (
        <p className={cn("font-mono text-lg font-bold tabular-nums", color)}>{countdown}</p>
      )}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

export interface WithdrawStatus {
  balance: number
  frozenBalance: number
  hasDeposited: boolean
  hasInvested: boolean
  withinWindow: boolean
  windowOpensMs: number
  onCooldown: boolean
  cooldownRemainingMs: number
}

export function WithdrawForm({ status: initialStatus }: { status: WithdrawStatus }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState("")
  const [hasSaved, setHasSaved] = useState(false)
  const resolveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Live countdown state
  const [windowMs, setWindowMs] = useState(initialStatus.windowOpensMs)
  const [cooldownMs, setCooldownMs] = useState(initialStatus.cooldownRemainingMs)

  // Tick every second for both countdowns
  useEffect(() => {
    const id = setInterval(() => {
      setWindowMs((v) => Math.max(0, v - 1000))
      setCooldownMs((v) => Math.max(0, v - 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const withinWindow = windowMs === 0 ? true : initialStatus.withinWindow
  const onCooldown   = cooldownMs > 0

  const [form, setForm] = useState({ amount: "", bankName: "", bankCode: "", accountNumber: "", accountName: "" })
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    startTransition(async () => {
      const saved = await getSavedBankDetails()
      if (saved?.savedBankName) {
        const bank = NIGERIAN_BANKS.find((b) => b.name === saved.savedBankName)
        setForm({ amount: "", bankName: saved.savedBankName, bankCode: bank?.code ?? "", accountNumber: saved.savedAccountNumber ?? "", accountName: saved.savedAccountName ?? "" })
        setHasSaved(true)
      }
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resolveTimeout.current) clearTimeout(resolveTimeout.current)
    setResolveError("")
    if (form.accountNumber.length === 10 && form.bankCode) {
      setResolving(true)
      resolveTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/bank/resolve?account_number=${form.accountNumber}&bank_code=${form.bankCode}`)
          const data = await res.json()
          if (data.accountName) {
            setForm((f) => ({ ...f, accountName: data.accountName }))
          } else {
            setForm((f) => ({ ...f, accountName: "" }))
            setResolveError(data.error ?? "Could not verify account")
          }
        } catch {
          setResolveError("Lookup failed — enter name manually")
        } finally {
          setResolving(false)
        }
      }, 600)
    } else if (form.accountNumber.length < 10) {
      setForm((f) => ({ ...f, accountName: "" }))
      setResolving(false)
    }
    return () => { if (resolveTimeout.current) clearTimeout(resolveTimeout.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.accountNumber, form.bankCode])

  const amount  = Number(form.amount)
  const charge  = amount > 0 ? Math.round((amount * SITE.withdrawalCharge) / 100) : 0
  const net     = amount - charge
  const blocked = !initialStatus.hasDeposited || !initialStatus.hasInvested || !withinWindow || onCooldown

  const canSubmit =
    !pending &&
    !blocked &&
    form.bankName &&
    form.accountNumber.length === 10 &&
    form.accountName &&
    amount >= SITE.minWithdrawal &&
    amount <= initialStatus.balance

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await requestWithdrawal({ amount, bankName: form.bankName, accountNumber: form.accountNumber, accountName: form.accountName })
      if (res.ok) {
        toast.success(res.message)
        router.push("/dashboard")
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  if (loading) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />)}
      </main>
    )
  }

  return (
    <>
      {showPicker && (
        <BankPicker
          value={form.bankName}
          onSelect={(bank) => { setForm((f) => ({ ...f, bankName: bank.name, bankCode: bank.code, accountName: "" })); setHasSaved(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground transition-all hover:text-foreground active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold">Withdraw Funds</h1>
            <p className="text-[11px] text-muted-foreground">
              Available: <span className="font-semibold text-foreground">{formatNaira(initialStatus.balance)}</span>
            </p>
          </div>
          {hasSaved && (
            <button onClick={() => { setForm({ amount: "", bankName: "", bankCode: "", accountNumber: "", accountName: "" }); setHasSaved(false) }} className="ml-auto text-[11px] font-semibold text-primary underline underline-offset-2">
              Change details
            </button>
          )}
        </div>

        {/* Frozen balance notice */}
        {initialStatus.frozenBalance > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-sky-400/25 bg-sky-400/8 px-3.5 py-3">
            <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            <div>
              <p className="text-xs font-semibold text-sky-500">Frozen referral earnings: {formatNaira(initialStatus.frozenBalance)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                This will move to your available balance once you make a deposit and activate an investment plan.
              </p>
            </div>
          </div>
        )}

        {/* ── Block states ── */}
        {!initialStatus.hasDeposited && (
          <BlockCard
            icon={Ban}
            color="text-destructive"
            bg="bg-destructive/8"
            border="border-destructive/20"
            title="Deposit required"
            body="You need to make at least one deposit before you can withdraw funds."
          />
        )}

        {initialStatus.hasDeposited && !initialStatus.hasInvested && (
          <BlockCard
            icon={Lock}
            color="text-amber-500"
            bg="bg-amber-400/8"
            border="border-amber-400/20"
            title="Investment required"
            body="Activate an investment plan before withdrawing. Visit the Projects tab to get started."
          />
        )}

        {initialStatus.hasDeposited && initialStatus.hasInvested && !withinWindow && (
          <BlockCard
            icon={Clock}
            color="text-primary"
            bg="bg-primary/8"
            border="border-primary/20"
            title={`Opens at ${SITE.withdrawalHours}`}
            body="Withdrawals are only processed during business hours (9 AM – 5 PM). Opens in:"
            countdown={fmtCountdown(windowMs)}
          />
        )}

        {initialStatus.hasDeposited && initialStatus.hasInvested && withinWindow && onCooldown && (
          <BlockCard
            icon={Clock}
            color="text-amber-500"
            bg="bg-amber-400/8"
            border="border-amber-400/20"
            title="One withdrawal per day"
            body="You already made a withdrawal today. Your next withdrawal unlocks in:"
            countdown={fmtCountdown(cooldownMs)}
          />
        )}

        {/* Info strip — always show */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/8 px-3.5 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-foreground/80">
            Available {SITE.withdrawalHours} · Once per day (23h cooldown) · Processed within{" "}
            <span className="font-semibold">{SITE.withdrawalProcessingTime}</span>. Fee:{" "}
            <span className="font-semibold">{SITE.withdrawalCharge}%</span>. Min:{" "}
            <span className="font-semibold">{formatNaira(SITE.minWithdrawal)}</span>.
          </p>
        </div>

        {hasSaved && (
          <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/8 px-3.5 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <p className="text-xs font-medium text-success">Saved bank details loaded</p>
          </div>
        )}

        {/* Form — rendered always but submit is disabled when blocked */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Amount (₦)">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">₦</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder={`Min. ${formatNaira(SITE.minWithdrawal)}`}
                value={form.amount}
                onChange={(e) => set("amount")(e.target.value)}
                className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
                disabled={blocked}
              />
              {amount > 0 && amount <= initialStatus.balance && <span className="shrink-0 text-xs font-semibold text-success">OK</span>}
              {amount > initialStatus.balance && <span className="shrink-0 text-xs font-semibold text-destructive">Exceeds balance</span>}
            </div>
          </Field>

          <Field label="Bank">
            <button type="button" onClick={() => !blocked && setShowPicker(true)} className="flex w-full items-center justify-between py-3.5 text-sm transition-all" disabled={blocked}>
              <span className={form.bankName ? "font-medium text-foreground" : "text-muted-foreground/60"}>{form.bankName || "Select your bank"}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </Field>

          <Field label="Account Number">
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit account number"
                value={form.accountNumber}
                onChange={(e) => set("accountNumber")(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 bg-transparent py-3.5 font-mono text-sm tracking-wider outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/60"
                disabled={blocked}
              />
              {resolving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
            </div>
          </Field>

          <Field label="Account Name">
            <div className="flex items-center gap-2">
              <input
                placeholder={resolving ? "Looking up..." : resolveError ? "Enter manually" : "Auto-filled from account number"}
                value={form.accountName}
                onChange={(e) => set("accountName")(e.target.value)}
                readOnly={resolving}
                disabled={blocked}
                className={cn("flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/60", form.accountName && "font-semibold text-foreground", resolving && "opacity-50")}
              />
              {form.accountName && !resolving && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
            </div>
            {resolveError && (
              <p className="flex items-center gap-1 pb-2 text-[11px] text-destructive">
                <AlertCircle className="h-3 w-3" />{resolveError}
              </p>
            )}
          </Field>

          {amount >= SITE.minWithdrawal && amount <= initialStatus.balance && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="border-b border-border/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Summary</p>
              </div>
              {[
                { label: "You withdraw",                    value: formatNaira(amount),                  dim: false },
                { label: `Fee (${SITE.withdrawalCharge}%)`, value: `- ${formatNaira(charge)}`,           dim: true  },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 last:border-0">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className={cn("text-sm tabular-nums", row.dim ? "text-muted-foreground" : "font-semibold text-foreground")}>{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-success/8 px-4 py-3">
                <span className="text-xs font-semibold text-success">You receive</span>
                <span className="text-base font-bold tabular-nums text-success">{formatNaira(net > 0 ? net : 0)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="group relative mt-1 flex w-full items-center justify-center overflow-hidden rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/35 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : blocked ? (
              <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Withdrawal Unavailable</span>
            ) : (
              <span className="flex items-center gap-2">Request Withdrawal <ShieldCheck className="h-4 w-4" /></span>
            )}
          </button>
        </form>
      </main>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="rounded-2xl border border-border/60 bg-card px-4 focus-within:border-primary/60 transition-colors">{children}</div>
    </div>
  )
}
