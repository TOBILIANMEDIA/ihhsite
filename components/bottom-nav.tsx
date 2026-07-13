'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, HardHat, Wallet, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard',       label: 'Home',     icon: Home    },
  { href: '/products',        label: 'Projects', icon: HardHat },
  { href: '/transactions',    label: 'Wallet',   icon: Wallet  },
  { href: '/team',            label: 'Team',     icon: Users   },
  { href: '/profile',         label: 'Profile',  icon: User    },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'group flex flex-1 flex-col items-center gap-1 py-3 transition-all duration-200',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                active ? 'bg-primary/15 text-primary' : 'group-hover:bg-secondary',
              )}>
                <tab.icon className="h-4.5 w-4.5" strokeWidth={active ? 2.5 : 1.8} />
              </span>
              <span className={cn(
                'text-[10px] font-semibold tracking-wide transition-all',
                active ? 'text-primary' : 'text-muted-foreground',
              )}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
