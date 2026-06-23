'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatCurrency, CATEGORIES } from '@/lib/constants'
import { calcBudgetUtilization } from '@/lib/calculations'
import { Wallet, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BudgetPage() {
  const [limits, setLimits] = useState<Record<string, number>>({})
  const [spending, setSpending] = useState<Record<string, number>>({})
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/setup').then(r => r.json()),
      fetch('/api/budget-limits').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([setup, budget, dash]) => {
      if (setup.data?.currency) setCurrency(setup.data.currency)
      const l: Record<string, number> = {}
      for (const item of budget.data ?? []) l[item.category] = item.limit
      setLimits(l)
      setSpending(dash.data?.categorySpending ?? {})
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/budget-limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      toast.success('Budget limits saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: number) => formatCurrency(n, currency)
  const currSymbol = currency === 'INR' ? '₹' : '$'

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Budget Limits</h1>
            <p className="text-slate-400 text-sm mt-0.5">Set monthly spending limits per category</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold text-sm rounded-xl transition-all">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading...</div>
        ) : (
          <div className="space-y-3">
            {CATEGORIES.map((cat, i) => {
              const limit = limits[cat.id] ?? 0
              const spent = spending[cat.id] ?? 0
              const util = calcBudgetUtilization(spent, limit)
              return (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{cat.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{cat.label}</p>
                      {limit > 0 && <p className="text-xs text-slate-500">{fmt(spent)} of {fmt(limit)} spent</p>}
                    </div>
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currSymbol}</span>
                      <input type="number" placeholder="No limit" value={limit || ''}
                        onChange={e => setLimits(l => ({ ...l, [cat.id]: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-5 pr-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500/60" />
                    </div>
                  </div>
                  {limit > 0 && <ProgressBar value={spent} max={limit} animate={false} />}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
