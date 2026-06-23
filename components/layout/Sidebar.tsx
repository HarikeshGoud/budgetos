'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, PlusCircle, List, BarChart3, Wallet, Lightbulb, TrendingUp, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/expenses/add', label: 'Add Expense',  icon: PlusCircle },
  { href: '/expenses',     label: 'Expenses',     icon: List },
  { href: '/reports',      label: 'Reports',      icon: BarChart3 },
  { href: '/budget',       label: 'Budget',       icon: Wallet },
  { href: '/insights',     label: 'Insights',     icon: Lightbulb },
  { href: '/income',       label: 'Income',       icon: TrendingUp },
  { href: '/settings',     label: 'Settings',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen border-r border-emerald-900/20 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden flex-shrink-0 hidden md:flex"
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-900/20">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 emerald-glow">
          <Zap className="w-4 h-4 text-emerald-400" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
              className="text-sm font-bold text-white whitespace-nowrap">
              Budget<span className="text-emerald-400">OS</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href.length > 1 && pathname.startsWith(href) && !NAV_ITEMS.some(n => n.href !== href && pathname.startsWith(n.href) && n.href.length > href.length))
          return (
            <Link key={href} href={href}>
              <motion.div whileHover={{ x: collapsed ? 0 : 2 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group cursor-pointer
                  ${active ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}>
                {active && <motion.div layoutId="activePill" className="absolute inset-0 rounded-xl bg-emerald-500/10" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
                <Icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${active ? 'text-emerald-400' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      className="relative z-10 whitespace-nowrap">{label}</motion.span>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                    {label}
                  </div>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <button onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors z-10">
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  )
}
