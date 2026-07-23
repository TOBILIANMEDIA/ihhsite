"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { getTelegramConfig, setTelegramConfig } from "@/app/actions/system-config"
import type { TelegramConfig as TelegramConfigType } from "@/app/actions/system-config"
import { Send, Users, Megaphone, Headphones, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = { onUpdate?: () => void }

type Field = {
  key: keyof TelegramConfigType
  label: string
  description: string
  icon: React.ReactNode
  placeholder: string
  prefix?: string
}

const FIELDS: Field[] = [
  {
    key: "groupLink",
    label: "Group Link",
    description: "Telegram group where members chat and get gift codes",
    icon: <Users className="h-4 w-4" />,
    placeholder: "https://t.me/yourgroup",
  },
  {
    key: "channelLink",
    label: "Channel Link",
    description: "Broadcast channel for announcements and updates",
    icon: <Megaphone className="h-4 w-4" />,
    placeholder: "https://t.me/yourchannel",
  },
  {
    key: "supportUsername",
    label: "Support Username",
    description: "Customer support account (without @)",
    icon: <Headphones className="h-4 w-4" />,
    placeholder: "yoursupporthandle",
    prefix: "@",
  },
]

const DEFAULT: TelegramConfigType = { groupLink: "", channelLink: "", supportUsername: "" }

export function TelegramConfig({ onUpdate }: Props) {
  const [config, setConfig] = useState<TelegramConfigType>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getTelegramConfig()
      .then((c) => setConfig(c))
      .catch(() => {/* use default */})
      .finally(() => setLoading(false))
  }, [])

  const update = (key: keyof TelegramConfigType, val: string) =>
    setConfig((prev) => ({ ...prev, [key]: val }))

  const handleSave = () => {
    startTransition(async () => {
      const result = await setTelegramConfig(config)
      if (result.ok) {
        toast.success("Telegram links updated — changes apply immediately")
        onUpdate?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  const supportLink = config.supportUsername
    ? `https://t.me/${config.supportUsername.replace(/^@/, "")}`
    : null

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/30 px-5 py-4">
          <div className="h-8 w-8 rounded-lg bg-secondary" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-secondary" />
            <div className="h-2.5 w-44 rounded bg-secondary" />
          </div>
        </div>
        <div className="space-y-4 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-secondary" />
              <div className="h-10 rounded-xl bg-secondary" />
            </div>
          ))}
          <div className="h-10 rounded-xl bg-secondary" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/30 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Send className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Telegram Links</h3>
          <p className="text-[11px] text-muted-foreground">
            Shown in welcome popup, profile, and info modal
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {FIELDS.map((field) => {
          const value = config[field.key]
          const previewLink =
            field.key === "supportUsername"
              ? supportLink
              : (value as string) || null

          return (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-primary">{field.icon}</span>
                <span className="text-xs font-semibold">{field.label}</span>
                {previewLink && (
                  <a
                    href={previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    Preview <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40">
                {field.prefix && (
                  <span className="border-r border-border bg-secondary/50 px-3 py-2.5 text-sm font-bold text-muted-foreground">
                    {field.prefix}
                  </span>
                )}
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{field.description}</p>
            </div>
          )
        })}

        <button
          onClick={handleSave}
          disabled={pending}
          className={cn(
            "w-full rounded-xl px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all",
            pending
              ? "cursor-not-allowed bg-primary/60"
              : "bg-primary hover:bg-primary/90 active:scale-[0.98]",
          )}
        >
          {pending ? "Saving…" : "Save Telegram Links"}
        </button>
      </div>
    </div>
  )
}
