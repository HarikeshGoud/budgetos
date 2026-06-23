'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, INCOME_SOURCES, MONTH_NAMES } from '@/lib/constants'
import { TrendingUp, Plus, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Income {
  id: number; source: string; amount: number; month: number; year: number; isRecurring: boolean; note?: string
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ source: 'salary', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), isRecurring: false, note: '' })

  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then(j => { if (j.data?.currency) setCurrency(j.data.currency) })
    loadIncome()
  }, [])

  function loadIncome() {
    setLoading(true)
    fetch('/api/income').then(r => r.json()).then(j => { setIncomes(j.data ?? []); setLoading(false) })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount) return
    try {
      const res = await fetch('/api/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      toast.success('Income added!')
      setForm({ source: 'salary', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), isRecurring: false, note: '' })
      setAdding(false)
      loadIncome()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/income?id=${id}`, { method: 'DELETE' })
      toast.success('Income deleted')
      loadIncome()
    } catch {
      toast.error('Failed')
    }
  }

  const fmt = (n: number) => formatCurrency(n, currency)
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Income</h1>
            <p className="text-slate-400 text-sm mt-0.5">Track all your income sources</p>
          </div>
          <button onClick={() => setAdding(a => !a)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm rounded-xl transition-all">
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Income</p>
            <p className="text-2xl font-bold text-white">{fmt(totalIncome)}</p>
          </div>
        </div>

        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Add Income Entry</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60">
                    {INCOME_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">Amount</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">Month</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60">
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1.5">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">Note (optional)</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. November salary"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} className="sr-only peer" />
                  <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-emerald-500/60 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-slate-300 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Recurring monthly</span>
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm transition-colors">Add Income</button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : incomes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No income entries yet</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {incomes.map(inc => {
                const source = INCOME_SOURCES.find(s => s.id === inc.source)
                return (
                  <div key={inc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{source?.label ?? inc.source}</p>
                      <p className="text-xs text-slate-500">{MONTH_NAMES[inc.month - 1]} {inc.year}{inc.note ? ` · ${inc.note}` : ''}{inc.isRecurring ? ' · Recurring' : ''}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">{fmt(inc.amount)}</p>
                    <button onClick={() => handleDelete(inc.id)}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
