"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, FolderOpen, Settings, Sun, Moon, Monitor, LayoutDashboard, LogOut, Bookmark, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

const STORAGE_KEY = "reconic:sidebar-collapsed"

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/research", label: "Research", icon: Search },
  { href: "/channels", label: "Channels", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
]

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark"
  const Icon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  const button = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => setTheme(next)}
      title={!collapsed && mounted ? `Theme: ${theme}` : undefined}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  if (!collapsed) return button

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right">{mounted ? `Theme: ${theme}` : "Theme"}</TooltipContent>
    </Tooltip>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const avatar = user?.user_metadata?.avatar_url as string | undefined
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0]

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-200 overflow-hidden",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex h-14 items-center font-bold text-base tracking-tight shrink-0",
        collapsed ? "justify-center px-0" : "px-5"
      )}>
        {collapsed ? "R" : "Reconic"}
      </div>
      <Separator />

      {/* Nav */}
      <TooltipProvider>
        <nav className={cn("flex flex-1 flex-col gap-0.5", collapsed ? "p-1.5" : "p-3")}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                  "h-9 text-sm",
                  collapsed
                    ? "w-9 px-0 justify-center"
                    : "justify-start gap-2.5 px-3"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return link
          })}

          <div className="flex-1" />

          {/* Toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 shrink-0", collapsed ? "w-9" : "w-9 self-end")}
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        </nav>
      </TooltipProvider>

      <Separator />

      {/* Profile area */}
      <TooltipProvider>
        <div className={cn(
          "flex items-center px-3 py-3",
          collapsed ? "flex-col gap-1.5" : "gap-2"
        )}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-medium">
              {name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {!collapsed && <span className="flex-1 truncate text-sm font-medium">{name}</span>}
          <div className={cn("flex items-center", collapsed ? "flex-col gap-0.5" : "gap-0.5")}>
            <ThemeToggle collapsed={collapsed} />
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  }
                />
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </TooltipProvider>
    </aside>
  )
}
