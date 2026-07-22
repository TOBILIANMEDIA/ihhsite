"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Loader2, ChevronDown, Search, CheckCircle2,
  AlertCircle, ShieldCheck, Clock, X,
} from "lucide-react"
import { toast } from "sonner"
import { SITE, formatNaira } from "@/lib/plans"
import { requestWithdrawal, getSavedBankDetails } from "@/app/actions/wallet"
import { getWithdrawalCharges } from "@/app/actions/system-config"
import type { WithdrawalCharges } from "@/lib/withdrawal"
import { calculateWithdrawalFee } from "@/lib/withdrawal"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────────────────────
// Nigerian banks — name + Paystack bank code
// ────────────────────────────────────────────────────────────
const NIGERIAN_BANKS = [
  { name: "Access Bank",                  code: "044" },
  { name: "Citibank Nigeria",             code: "023" },
  { name: "Ecobank Nigeria",              code: "050" },
  { name: "Fidelity Bank",               code: "070" },
  { name: "First Bank of Nigeria",        code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Globus Bank",                  code: "00103" },
  { name: "Guaranty Trust Bank (GTB)",    code: "058" },
  { name: "Heritage Bank",               code: "030" },
  { name: "Jaiz Bank",                   code: "301" },
  { name: "Keystone Bank",               code: "082" },
  { name: "Kuda Bank",                   code: "50211" },
  { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "OPay (PayCom)",               code: "999992" },
  { name: "Palmpay",                     code: "999991" },
  { name: "Polaris Bank",                code: "076" },
  { name: "Providus Bank",               code: "101" },
  { name: "Stanbic IBTC Bank",           code: "221" },
  { name: "Standard Chartered Bank",     code: "068" },
  { name: "Sterling Bank",               code: "232" },
  { name: "SunTrust Bank",               code: "100" },
  { name: "Titan Trust Bank",            code: "102" },
  { name: "Union Bank",                  code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank",                  code: "215" },
  { name: "VFD Microfinance Bank",       code: "566" },
  { name: "Wema Bank",                   code: "035" },
  { name: "Zenith Bank",                 code: "057" },
] as const

// ────────────────────────────────────────────────────────────
// Bank picker sheet
// ────────────────────────────────────────────────────────────
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
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground transition-all hover:text-foreground active:scale-95">
          <X className="h-4 w-4" />
        </button>
        <h2 className="flex-1 text-base font-bold">Select Bank</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-2.5 focus-within:border-primary/50 transition-colors">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bank..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No bank found</p>
        ) : (
          <ul>
            {filtered.map((bank) => (
              <li key={bank.code}>
                <button
                  onClick={() => { onSelect(bank); onClose() }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3.5 text-left transition-all hover:bg-secondary/50 active:bg-secondary",
                    value === bank.name && "bg-primary/8",
                  )}
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

// ────────────────────────────────────────────────────────────
// Main withdraw form
// ────────────────────────────────────────────────────────────
export function WithdrawForm({ balance, totalDeposited = 0 }: { balance: number; totalDeposited?: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState("")
  const [hasSaved, setHasSaved] = useState(false)
  const [charges, setCharges] = useState<WithdrawalCharges>({ fixedFeeNaira: 0, percentageFee: SITE.withdrawalCharge })
  const resolveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Time window validation — 9 AM to 5 PM only
  const now = new Date()
  const hour = now.getHours()
  const withinWindow = hour >= 9 && hour < 17
  const nextOpenHour = hour >= 17 ? "09:00 tomorrow" : `${String(9).padStart(2, '0')}:00 today`

  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  })
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  // Load saved details and live charges on mount
  useEffect(() => {
    startTransition(async () => {
      const [saved, liveCharges] = await Promise.all([getSavedBankDetails(), getWithdrawalCharges()])
      if (liveCharges) setCharges(liveCharges)
      if (saved?.savedBankName) {
        const bank = NIGERIAN_BANKS.find((b) => b.name === saved.savedBankName)
        setForm({
          amount: "",
          bankName: saved.savedBankName,
          bankCode: bank?.code ?? "",
          accountNumber: saved.savedAccountNumber ?? "",
          accountName: saved.savedAccountName ?? "",
        })
        setHasSaved(true)
      }
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-lookup account name when account number reaches 10 digits + bank selected
  useEffect(() => {
    if (resolveTimeout.current) clearTimeout(resolveTimeout.current)
    setResolveError("")

    if (form.accountNumber.length === 10 && form.bankCode) {
      setResolving(true)
      resolveTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/bank/resolve?account_number=${form.accountNumber}&bank_code=${form.bankCode}`,
          )
          const data = await res.json()
          if (data.accountName) {
            setForm((f) => ({ ...f, accountName: data.accountName }))
            setResolveError("")
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

  const amount = Number(form.amount)
  const charge = amount > 0 ? calculateWithdrawalFee(amount, charges) : 0
  const net = amount - charge
  const feeLabel = charges.fixedFeeNaira > 0 && charges.percentageFee > 0
    ? `Fee (₦${charges.fixedFeeNaira} + ${charges.percentageFee}%)`
    : charges.percentageFee > 0
    ? `Fee (${charges.percentageFee}%)`
    : `Fee (₦${charges.fixedFeeNaira})`
  const hasDeposited = totalDeposited > 0
  const canSubmit =
    !pending &&
    form.bankName &&
    form.accountNumber.length === 10 &&
    form.accountName &&
    amount >= SITE.minWithdrawal &&
    amount <= balance &&
    hasDeposited &&
    withinWindow

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await requestWithdrawal({
        amount,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
      })
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </main>
    )
  }

  return (
    <>
      {showPicker && (
        <BankPicker
          value={form.bankName}
          onSelect={(bank) => {
            setForm((f) => ({ ...f, bankName: bank.name, bankCode: bank.code, accountName: "" }))
            setHasSaved(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        {/* Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground transition-all hover:text-foreground active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold">Withdraw Funds</h1>
            <p className="text-[11px] text-muted-foreground">
              Available: <span className="font-semibold text-foreground">{formatNaira(balance)}</span>
            </p>
          </div>
          {hasSaved && (
            <button
              onClick={() => {
                setForm({ amount: "", bankName: "", bankCode: "", accountNumber: "", accountName: "" })
                setHasSaved(false)
              }}
              className="ml-auto text-[11px] font-semibold text-primary underline underline-offset-2"
            >
              Change details
            </button>
          )}
        </div>

        {/* Info strip */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/8 px-3.5 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-foreground/80">
            Available {SITE.withdrawalHours} · Processed within{" "}
            <span className="font-semibold">{SITE.withdrawalProcessingTime}</span>. A{" "}
            <span className="font-semibold">{SITE.withdrawalCharge}% fee</span> applies. Min{" "}
            <span className="font-semibold">{formatNaira(SITE.minWithdrawal)}</span>.
          </p>
        </div>

        {hasSaved && (
          <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/8 px-3.5 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            <p className="text-xs font-medium text-success">Saved bank details loaded</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Amount */}
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
              />
              {amount > 0 && amount <= balance && (
                <span className="shrink-0 text-xs font-semibold text-success">OK</span>
              )}
              {amount > balance && (
                <span className="shrink-0 text-xs font-semibold text-destructive">Exceeds balance</span>
              )}
            </div>
          </Field>

          {/* Bank selector */}
          <Field label="Bank">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex w-full items-center justify-between py-3.5 text-sm transition-all"
            >
              <span className={form.bankName ? "font-medium text-foreground" : "text-muted-foreground/60"}>
                {form.bankName || "Select your bank"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </Field>

          {/* Account number */}
          <Field label="Account Number">
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit account number"
                value={form.accountNumber}
                onChange={(e) => set("accountNumber")(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 bg-transparent py-3.5 font-mono text-sm tracking-wider outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/60"
              />
              {resolving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
            </div>
          </Field>

          {/* Account name — auto-filled or manual fallback */}
          <Field label="Account Name">
            <div className="flex items-center gap-2">
              <input
                placeholder={resolving ? "Looking up..." : resolveError ? "Enter manually" : "Auto-filled from account number"}
                value={form.accountName}
                onChange={(e) => set("accountName")(e.target.value)}
                readOnly={resolving}
                className={cn(
                  "flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/60",
                  form.accountName && "font-semibold text-foreground",
                  resolving && "opacity-50",
                )}
              />
              {form.accountName && !resolving && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              )}
            </div>
            {resolveError && (
              <p className="flex items-center gap-1 pb-2 text-[11px] text-destructive">
                <AlertCircle className="h-3 w-3" />
                {resolveError}
              </p>
            )}
          </Field>

          {/* Validation messages */}
          {!hasDeposited && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">Cannot withdraw yet</p>
                <p className="mt-1 text-xs text-destructive/80">You must deposit and invest in a plan before withdrawing.</p>
              </div>
            </div>
          )}

          {!withinWindow && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <Clock className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-600">Withdrawals are closed</p>
                <p className="mt-1 text-xs text-amber-600/80">Withdrawals open daily from <span className="font-mono font-bold">09:00 - 17:00</span>. Next available: {nextOpenHour}</p>
              </div>
            </div>
          )}

          {/* Fee summary */}
          {amount >= SITE.minWithdrawal && amount <= balance && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="border-b border-border/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Summary</p>
              </div>
              {[
                { label: "You withdraw",       value: formatNaira(amount),          dim: false },
                { label: feeLabel, value: `- ${formatNaira(charge)}`, dim: true  },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 last:border-0">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className={cn("text-sm tabular-nums", row.dim ? "text-muted-foreground" : "font-semibold text-foreground")}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-success/8 px-4 py-3">
                <span className="text-xs font-semibold text-success">You receive</span>
                <span className="text-base font-bold tabular-nums text-success">{formatNaira(net > 0 ? net : 0)}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="group relative mt-1 flex w-full items-center justify-center overflow-hidden rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/35 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Request Withdrawal
                <ShieldCheck className="h-4 w-4" />
              </span>
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
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="rounded-2xl border border-border/60 bg-card px-4 focus-within:border-primary/60 transition-colors">
        {children}
      </div>
    </div>
  )
}
