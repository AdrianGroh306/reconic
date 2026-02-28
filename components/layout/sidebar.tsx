"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, FolderOpen, Settings, Sun, Moon, Monitor, LayoutDashboard, LogOut, Bookmark } from "lucide-react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard", label: "Research", icon: Search },
  { href: "/channels", label: "Channels", icon: Bookmark },
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
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const avatar = user?.user_metadata?.avatar_url as string | undefined
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0]

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
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                "justify-start gap-2.5 h-9 px-3 text-sm"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />
      <div className="flex items-center gap-2 px-3 py-3">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-medium">
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <span className="flex-1 truncate text-sm font-medium">{name}</span>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
