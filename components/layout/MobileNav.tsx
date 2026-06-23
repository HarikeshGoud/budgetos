'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, List, BarChart3, Settings } from 'lucide-react'

const MOBILE_NAV = [
  { href: '/dashboard',    label: 'Home',     icon: LayoutDashboard },
  { href: '/expenses/add', label: 'Add',      icon: PlusCircle },
  { href: '/expenses',     label: 'History',  icon: List },
  { href: '/reports',      label: 'Reports',  icon: BarChart3 },
  { href: '/settings',     label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-emerald-900/20 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href)
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-slate-500'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
