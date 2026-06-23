'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import { CURRENCIES } from '@/lib/constants'
import { User, Download, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface UserData { id: number; name: string; currency: string; savingsGoal: number }

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [form, setForm] = useState({ name: '', currency: 'INR', savingsGoal: 20 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then(j => {
      if (j.data) { setUser(j.data); setForm({ name: j.data.name, currency: j.data.currency, savingsGoal: j.data.savingsGoal }) }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/setup', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const j = await res.json()
      if (!j.success) throw new Error(j.error)
      setUser(j.data)
      toast.success('Settings saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.replace('/login')
  }

  async function handleExportPDF() {
    try {
      const [expRes, incRes] = await Promise.all([
        fetch('/api/expenses?limit=1000').then(r => r.json()),
        fetch('/api/income').then(r => r.json()),
      ])
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('BudgetOS — Finance Report', 14, 20)
      doc.setFontSize(11)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28)
      autoTable(doc, {
        startY: 35,
        head: [['Date', 'Category', 'Amount', 'Payment', 'Note']],
        body: (expRes.data?.expenses ?? []).map((e: { date: string; category: string; amount: number; paymentMethod: string; note?: string }) => [
          new Date(e.date).toLocaleDateString('en-IN'),
          e.category.replace(/-/g, ' '),
          `${form.currency === 'INR' ? '₹' : '$'}${e.amount}`,
          e.paymentMethod,
          e.note ?? '',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
      })
      doc.save('budgetos-report.pdf')
      toast.success('PDF exported!')
    } catch {
      toast.error('PDF export failed')
    }
  }

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your profile and preferences</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Profile</h2>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Your Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-2">Currency</label>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map(c => (
                  <label key={c.code} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl cursor-pointer border transition-all text-center ${form.currency === c.code ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    <input type="radio" name="currency" value={c.code} checked={form.currency === c.code} onChange={() => setForm(f => ({ ...f, currency: c.code }))} className="sr-only" />
                    <span className="text-xl font-bold">{c.symbol}</span>
                    <span className="text-[10px]">{c.code}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Savings Goal: <span className="text-emerald-400">{form.savingsGoal}%</span></label>
              <input type="range" min="5" max="70" step="5" value={form.savingsGoal}
                onChange={e => setForm(f => ({ ...f, savingsGoal: parseInt(e.target.value) }))} className="w-full" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold text-sm transition-all">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-white mb-4">Actions</h2>
          <button onClick={handleExportPDF}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-all text-sm">
            <Download className="w-4 h-4" /> Export Full Report (PDF)
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition-all text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </motion.div>
      </div>
    </AppShell>
  )
}
