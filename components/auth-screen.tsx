"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Phone, Lock, ShieldCheck, Tag, User, Loader2, Megaphone, Eye, EyeOff, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Logo } from "@/components/logo"
import { SITE } from "@/lib/plans"
import { authClient } from "@/lib/auth-client"
import { initAccount, resolveLoginEmail } from "@/app/actions/account"
import { cn } from "@/lib/utils"

type Mode = "sign-in" | "sign-up"

function Field({
  id, label, hint, icon: Icon, type = "text", placeholder, value, onChange,
}: {
  id: string; label: string; hint?: string; icon: typeof Mail
  type?: string; placeholder?: string; value: string; onChange: (v: string) => void
}) {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (showPw ? "text" : "password") : type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}{hint && <span className="ml-1 normal-case font-normal opacity-60">({hint})</span>}
      </label>
      <div className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3.5 transition-all focus-within:border-primary/60 focus-within:bg-secondary/70">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

export function AuthScreen({ defaultInvite = "", promoCode = "" }: { defaultInvite?: string; promoCode?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(promoCode ? "sign-up" : "sign-in")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", identifier: "", email: "", phone: "",
    password: "", confirm: "", invite: defaultInvite,
  })
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  async function handleSignIn() {
    if (!form.identifier || !form.password) { toast.error("Enter your email/phone and password"); return }
    setLoading(true)
    try {
      const { email } = await resolveLoginEmail(form.identifier)
      if (!email) { toast.error("No account found"); return }
      const { error } = await authClient.signIn.email({ email, password: form.password })
      if (error) { toast.error(error.message || "Invalid credentials"); return }
      toast.success("Welcome back.")
      router.push("/dashboard"); router.refresh()
    } catch { toast.error("Something went wrong. Try again.") }
    finally { setLoading(false) }
  }

  async function handleSignUp() {
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all required fields"); return
    }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return }
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return }
    setLoading(true)
    try {
      const result = await authClient.signUp.email({
        email: form.email.toLowerCase(), password: form.password, name: form.name,
      })
      if (result.error) { toast.error(result.error.message || "Could not create account"); return }
      await initAccount({ phone: form.phone, inviteCode: form.invite, promoCode })
      toast.success(`Account created. Welcome to ${SITE.short}.`)
      router.push("/dashboard"); router.refresh()
    } catch { toast.error("Something went wrong. Try again.") }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top stripe */}
      <div className="h-0.5 w-full bg-primary/60" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-10">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-start gap-4">
          <Logo className="h-12 w-12" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              {SITE.tagline}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground text-balance">
              {mode === "sign-in" ? "Sign in to your account" : "Create your account"}
            </h1>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="mb-6 flex rounded-xl border border-border/60 bg-secondary/30 p-1 gap-1">
          {(["sign-in", "sign-up"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200",
                mode === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "sign-in" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => { e.preventDefault(); mode === "sign-in" ? handleSignIn() : handleSignUp() }}
        >
          {mode === "sign-up" && promoCode && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/8 p-3.5">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-foreground/80 leading-relaxed">
                You&apos;re registering with a <span className="font-bold text-foreground">Promoter</span> invite.
                Your account will be tagged as a promoter automatically.
              </p>
            </div>
          )}

          {mode === "sign-up" && (
            <Field id="name" label="Full Name" icon={User} placeholder="Your full name" value={form.name} onChange={set("name")} />
          )}

          {mode === "sign-in" ? (
            <Field id="identifier" label="Email or Phone" icon={Mail} placeholder="email@example.com or 080..." value={form.identifier} onChange={set("identifier")} />
          ) : (
            <>
              <Field id="email" label="Email Address" icon={Mail} type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} />
              <Field id="phone" label="Phone Number" icon={Phone} type="tel" placeholder="080XXXXXXXX" value={form.phone} onChange={set("phone")} />
            </>
          )}

          <Field id="password" label="Password" icon={Lock} type="password" placeholder="Min. 8 characters" value={form.password} onChange={set("password")} />

          {mode === "sign-up" && (
            <>
              <Field id="confirm" label="Confirm Password" icon={ShieldCheck} type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} />
              <Field id="invite" label="Invite Code" hint="optional" icon={Tag} placeholder="Enter invite code" value={form.invite} onChange={set("invite")} />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
          >
            {/* Subtle sheen sweep on hover */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {mode === "sign-in" ? "Sign In to Account" : "Create My Account"}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "sign-in" ? "No account? " : "Already registered? "}
          <button onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} className="font-semibold text-primary hover:underline">
            {mode === "sign-in" ? "Register here" : "Sign in"}
          </button>
        </p>

        {/* Footer */}
        <p className="mt-auto pt-12 text-center text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          {SITE.short} &bull; {SITE.tagline}
        </p>
      </main>
    </div>
  )
}
