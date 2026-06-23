'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, getCategoryById, MONTH_NAMES } from '@/lib/constants'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

interface ReportData {
  month: number; year: number; totalIncome: number; totalSpent: number; netSavings: number
  savingsRate: number; momChange: number; categoryTable: { category: string; spent: number; pctOfTotal: number; momChange: number }[]
  sixMonthsData: { month: number; year: number; spent: number; income: number }[]
  top5Expenses: { id: number; amount: number; category: string; note?: string; date: string }[]
  dailyHeatmap: { day: number; amount: number }[]
}

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<ReportData | null>(null)
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then(j => { if (j.data?.currency) setCurrency(j.data.currency) })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?month=${month}&year=${year}`).then(r => r.json()).then(j => {
      setData(j.data)
      setLoading(false)
    })
  }, [month, year])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const fmt = (n: number) => formatCurrency(n, currency)
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

  const sixMonthLabels = data?.sixMonthsData.map(d => MONTH_NAMES[d.month - 1].slice(0, 3)) ?? []

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-semibold min-w-32 text-center">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={nextMonth} disabled={isCurrentMonth} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading...</div>
        ) : !data ? (
          <div className="text-center text-slate-500 py-12">No data for this month</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Income', value: fmt(data.totalIncome), color: 'text-emerald-400' },
                { label: 'Spent', value: fmt(data.totalSpent), color: 'text-red-400' },
                { label: 'Saved', value: fmt(data.netSavings), color: data.netSavings >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Savings Rate', value: `${data.savingsRate.toFixed(1)}%`, color: 'text-blue-400' },
              ].map(({ label, value, color }) => (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">6-Month Trend</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.sixMonthsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="month" tickFormatter={m => MONTH_NAMES[m - 1].slice(0, 3)} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #1e3a5f', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(v, name) => [fmt(Number(v)), name === 'spent' ? 'Spent' : 'Income']} />
                    <Bar dataKey="income" fill="rgba(16,185,129,0.3)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Daily Spending</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.dailyHeatmap} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #1e3a5f', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(v) => [fmt(Number(v)), 'Spent']} labelFormatter={l => `Day ${l}`} />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Category Breakdown</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {data.categoryTable.map(row => {
                  const cat = getCategoryById(row.category)
                  return (
                    <div key={row.category} className="flex items-center gap-4 px-5 py-3">
                      <span className="text-lg w-7 text-center">{cat.emoji}</span>
                      <span className="text-sm text-slate-300 flex-1">{cat.label}</span>
                      <span className="text-xs text-slate-500">{row.pctOfTotal.toFixed(1)}%</span>
                      <div className="flex items-center gap-1 text-xs">
                        {row.momChange > 0 ? <TrendingUp className="w-3 h-3 text-red-400" /> : <TrendingDown className="w-3 h-3 text-emerald-400" />}
                        <span className={row.momChange > 0 ? 'text-red-400' : 'text-emerald-400'}>{Math.abs(row.momChange).toFixed(0)}%</span>
                      </div>
                      <span className="text-sm font-semibold text-white w-24 text-right">{fmt(row.spent)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {data.top5Expenses.length > 0 && (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800">
                  <h2 className="text-sm font-semibold text-white">Top 5 Expenses</h2>
                </div>
                <div className="divide-y divide-slate-800">
                  {data.top5Expenses.map((exp, i) => {
                    const cat = getCategoryById(exp.category)
                    return (
                      <div key={exp.id} className="flex items-center gap-4 px-5 py-3">
                        <span className="text-xs text-slate-600 w-4">#{i + 1}</span>
                        <span className="text-lg">{cat.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300">{cat.label}</p>
                          {exp.note && <p className="text-xs text-slate-500 truncate">{exp.note}</p>}
                        </div>
                        <p className="text-sm font-bold text-white">{fmt(exp.amount)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
