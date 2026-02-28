import { Sidebar } from "@/components/layout/sidebar"
import { UserProvider } from "@/components/providers/user-provider"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </UserProvider>
  )
}
