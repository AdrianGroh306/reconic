"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, FolderOpen, Settings, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard", label: "Research", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark"
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => setTheme(next)}
      title={`Theme: ${theme}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-background">
      <div className="flex h-14 items-center px-5 font-bold text-base tracking-tight">
        Reconic
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("justify-start gap-2.5 h-9 px-3 text-sm")}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </nav>

      <Separator />
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Built by{" "}
          <span className="font-medium text-foreground">Adrian</span>
        </p>
        <ThemeToggle />
      </div>
    </aside>
  )
}
