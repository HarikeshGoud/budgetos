'use client'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden mesh-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 md:pt-0"
        style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
