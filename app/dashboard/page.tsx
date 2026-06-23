'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import StatsCard from '@/components/ui/StatsCard'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, getCategoryById, MONTH_NAMES } from '@/lib/constants'
import { calcBudgetUtilization, getBudgetStatus } from '@/lib/calculations'
import { DollarSign, TrendingUp, TrendingDown, Target, Plus, Wallet, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface DashboardData {
  user: { name: string; currency: string; savingsGoal: number }
  totalIncome: number; totalSpent: number; remaining: number; savingsRate: number
  projectedSpend: number; momChange: number
  categorySpending: Record<string, number>
  prevCategorySpending: Record<string, number>
  dailySpending: Record<string, number>
  budgetLimits: Record<string, number>
  month: number; year: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(j => { setData(j.data); setLoading(false) })
  }, [])

  if (loading) return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </AppShell>
  )

  if (!data) return (
    <AppShell>
      <div className="flex items-center justify-center h-full text-slate-400">No data yet. Add your first expense!</div>
    </AppShell>
  )

  const { user, totalIncome, totalSpent, remaining, savingsRate, momChange, categorySpending, budgetLimits, dailySpending } = data
  const fmt = (n: number) => formatCurrency(n, user.currency)
  const currSymbol = user.currency === 'INR' ? '₹' : '$'

  const categoryChartData = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a).slice(0, 6)
    .map(([id, amount]) => {
      const cat = getCategoryById(id)
      return { name: cat.label.split('&')[0].trim(), value: amount, color: cat.color, emoji: cat.emoji }
    })

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailyChartData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return { day: d, amount: dailySpending[dateStr] ?? 0 }
  })

  const budgetCards = Object.entries(budgetLimits).map(([cat, limit]) => {
    const spent = categorySpending[cat] ?? 0
    const util = calcBudgetUtilization(spent, limit)
    const status = getBudgetStatus(util)
    const info = getCategoryById(cat)
    return { cat, limit, spent, util, status, info }
  }).sort((a, b) => b.util - a.util).slice(0, 6)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; emoji: string } }[] }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-900/95 border border-slate-700 rounded-xl px-3 py-2 text-sm">
        <p className="text-slate-300">{payload[0].payload.emoji} {payload[0].payload.name}</p>
        <p className="text-emerald-400 font-bold">{fmt(payload[0].payload.value)}</p>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, <span className="text-emerald-400">{user.name}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{MONTH_NAMES[data.month - 1]} {data.year} — financial overview</p>
          </div>
          <Link href="/expenses/add">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25">
              <Plus className="w-4 h-4" /> Add Expense
            </motion.button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Monthly Income" value={fmt(totalIncome)} sub="This month" icon={TrendingUp} iconColor="text-emerald-400" iconBg="bg-emerald-500/15" index={0} />
          <StatsCard title="Total Spent" value={fmt(totalSpent)} trend={momChange} icon={TrendingDown} iconColor="text-red-400" iconBg="bg-red-500/15" index={1} />
          <StatsCard title="Remaining" value={fmt(remaining)} sub={`${((remaining / Math.max(totalIncome, 1)) * 100).toFixed(0)}% of income`} icon={Wallet} iconColor="text-blue-400" iconBg="bg-blue-500/15" index={2} />
          <StatsCard title="Savings Rate" value={`${savingsRate.toFixed(1)}%`} sub={`Goal: ${user.savingsGoal}%`} icon={Target} iconColor={savingsRate >= user.savingsGoal ? 'text-emerald-400' : 'text-amber-400'} iconBg={savingsRate >= user.savingsGoal ? 'bg-emerald-500/15' : 'bg-amber-500/15'} index={3} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Savings Goal Progress</h2>
            <Badge variant={savingsRate >= user.savingsGoal ? 'success' : savingsRate >= user.savingsGoal * 0.7 ? 'warning' : 'danger'}>
              {savingsRate >= user.savingsGoal ? '🎯 On Track' : '⚠️ Behind Goal'}
            </Badge>
          </div>
          <ProgressBar value={Math.min(savingsRate, user.savingsGoal)} max={user.savingsGoal} color={savingsRate >= user.savingsGoal ? '#10b981' : '#f59e0b'} animate />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>Current: {savingsRate.toFixed(1)}%</span>
            <span>Goal: {user.savingsGoal}%</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Top Spending Categories</h2>
            {categoryChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No expenses yet</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {categoryChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryChartData.map(({ name, value, color, emoji }) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs text-slate-400 truncate flex-1">{emoji} {name}</span>
                      <span className="text-xs text-white font-medium">{fmt(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Daily Spending This Month</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${currSymbol}${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #1e3a5f', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(v) => [fmt(Number(v)), 'Spent']} labelFormatter={(l) => `Day ${l}`} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {budgetCards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Budget Health</h2>
              <Link href="/budget" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {budgetCards.map(({ cat, limit, spent, util, status, info }) => (
                <div key={cat} className="glass-card rounded-xl p-4 hover:border-emerald-500/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{info.emoji}</span>
                      <span className="text-sm text-slate-300 font-medium truncate">{info.label.split('&')[0].trim()}</span>
                    </div>
                    {status === 'danger' ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> :
                     status === 'warning' ? <Info className="w-3.5 h-3.5 text-amber-400" /> :
                     <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <ProgressBar value={spent} max={limit} animate />
                  <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                    <span>{fmt(spent)} spent</span>
                    <span>{fmt(limit)} limit</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
