'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate, getCategoryById, CATEGORIES } from '@/lib/constants'
import { Search, Filter, Trash2, Edit2, Download, ChevronLeft, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Expense {
  id: number; amount: number; category: string; subCategory?: string
  paymentMethod: string; note?: string; date: string; isRecurring: boolean
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('INR')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const limit = 20

  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then(j => { if (j.data?.currency) setCurrency(j.data.currency) })
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder })
    if (search) params.set('search', search)
    if (category !== 'all') params.set('category', category)
    fetch(`/api/expenses?${params}`).then(r => r.json()).then(j => {
      setExpenses(j.data?.expenses ?? [])
      setTotal(j.data?.total ?? 0)
      setLoading(false)
    })
  }, [page, search, category, sortBy, sortOrder])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      toast.success('Expense deleted')
      setDeleteId(null)
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  function exportCSV() {
    const rows = [['Date', 'Category', 'Amount', 'Payment', 'Note']]
    expenses.forEach(e => rows.push([formatDate(e.date), getCategoryById(e.category).label, String(e.amount), e.paymentMethod, e.note ?? '']))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'expenses.csv'
    a.click()
  }

  const fmt = (n: number) => formatCurrency(n, currency)
  const totalPages = Math.ceil(total / limit)

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Expenses</h1>
            <p className="text-slate-400 text-sm mt-0.5">{total} total transactions</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-emerald-400 glass-card rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search notes, categories..."
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60" />
          </div>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}
            className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60">
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split(':'); setSortBy(s); setSortOrder(o) }}
            className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60">
            <option value="date:desc">Newest first</option>
            <option value="date:asc">Oldest first</option>
            <option value="amount:desc">Highest amount</option>
            <option value="amount:asc">Lowest amount</option>
          </select>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No expenses found</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {expenses.map(exp => {
                const cat = getCategoryById(exp.category)
                return (
                  <motion.div key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                    <div className={`w-9 h-9 rounded-xl ${cat.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{cat.label}</p>
                      <p className="text-xs text-slate-500">{formatDate(exp.date)} · {exp.paymentMethod}{exp.note ? ` · ${exp.note}` : ''}</p>
                    </div>
                    {exp.isRecurring && <Badge variant="info" size="xs">Recurring</Badge>}
                    <p className="text-sm font-bold text-white">{fmt(exp.amount)}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditExpense(exp)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-emerald-500/20 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(exp.id)} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editExpense && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setEditExpense(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <ExpenseForm
                currency={currency}
                initialData={{ ...editExpense, date: new Date(editExpense.date).toISOString().split('T')[0] }}
                onClose={() => setEditExpense(null)}
                onSuccess={() => { setEditExpense(null); load() }}
              />
            </motion.div>
          </motion.div>
        )}

        {deleteId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm text-center">
              <div className="w-12 h-12 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Delete Expense?</h3>
              <p className="text-slate-400 text-sm mb-6">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
