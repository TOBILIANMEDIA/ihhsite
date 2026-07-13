'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Menu } from 'lucide-react'
import { LogoWordmark } from '@/components/logo'
import { InfoModal } from '@/components/info-modal'

export function AppHeader({ title }: { title?: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          {title ? (
            <h1 className="text-base font-bold tracking-tight text-foreground">{title}</h1>
          ) : (
            <LogoWordmark />
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="Platform information"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/60 text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>
      {mounted && open && createPortal(
        <InfoModal open={open} onClose={() => setOpen(false)} />,
        document.body,
      )}
    </>
  )
}
