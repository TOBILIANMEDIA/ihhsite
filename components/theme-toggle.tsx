"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/60 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-foreground active:scale-95",
        className,
      )}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: theme === "dark" ? 1 : 0, transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)" }}
      >
        <Moon className="h-4 w-4" />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{ opacity: theme === "light" ? 1 : 0, transform: theme === "light" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)" }}
      >
        <Sun className="h-4 w-4" />
      </span>
    </button>
  )
}
