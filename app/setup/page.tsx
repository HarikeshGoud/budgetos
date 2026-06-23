'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { CATEGORIES, CURRENCIES } from '@/lib/constants'
import { suggest5030 } from '@/lib/calculations'
import { Zap, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  currency: z.string(),
  monthlyIncome: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Enter valid income'),
  savingsGoal: z.number().min(0).max(100),
})

type FormData = z.infer<typeof schema>
const STEPS = ['Welcome', 'Income', 'Savings', 'Budget']

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({})

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', currency: 'INR', monthlyIncome: '', savingsGoal: 20 },
  })

  const income = parseFloat(watch('monthlyIncome') || '0') || 0
  const savingsGoal = watch('savingsGoal')
  const currency = watch('currency')
  const currSymbol = CURRENCIES.find(c => c.code === currency)?.symbol ?? '₹'

  function applyRule() {
    const { needs, wants } = suggest5030(income)
    const perNeed = needs / 4
    const perWant = wants / 5
    setBudgetLimits({
      'housing-rent': Math.round(income * 0.25),
      'groceries': Math.round(perNeed * 0.8),
      'transport-fuel': Math.round(perNeed * 0.6),
      'utilities-bills': Math.round(perNeed * 0.5),
      'food-dining': Math.round(perWant),
      'entertainment': Math.round(perWant * 0.6),
      'shopping-clothing': Math.round(perWant * 0.8),
      'health-medical': Math.round(income * 0.05),
      'subscriptions-tech': Math.round(income * 0.03),
    })
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, monthlyIncome: parseFloat(data.monthlyIncome), budgetLimits }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(`Welcome, ${data.name}! 🎉`)
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const canAdvance = () => {
    if (step === 0) return watch('name').length > 0
    if (step === 1) return income > 0
    return true
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-600'}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-emerald-500' : 'bg-slate-700'} transition-colors`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
          className="glass-card rounded-3xl p-8 border border-slate-700/50">
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 emerald-glow">
                    <Zap className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">Welcome to <span className="text-emerald-400">BudgetOS</span></h1>
                  <p className="text-slate-400 text-sm">Your personal finance command center</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-2">What should we call you?</label>
                  <input {...register('name')} placeholder="Your name" autoFocus
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all text-lg" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-2">Currency</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CURRENCIES.map(c => (
                      <label key={c.code} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl cursor-pointer border transition-all text-center ${currency === c.code ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                        <input type="radio" {...register('currency')} value={c.code} className="sr-only" />
                        <span className="text-xl font-bold">{c.symbol}</span>
                        <span className="text-[10px]">{c.code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Your Income</h2>
                  <p className="text-slate-400 text-sm">We use this to calculate your budget and savings rate</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-2">Monthly take-home income</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xl">{currSymbol}</span>
                    <input type="number" {...register('monthlyIncome')} placeholder="50,000" autoFocus
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-4 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all text-2xl font-bold" />
                  </div>
                  {errors.monthlyIncome && <p className="text-red-400 text-xs mt-1">{errors.monthlyIncome.message}</p>}
                </div>
                {income > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> 50/30/20 Rule Preview</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[['50% Needs', income * 0.5], ['30% Wants', income * 0.3], ['20% Save', income * 0.2]].map(([label, val]) => (
                        <div key={String(label)}>
                          <p className="text-white font-bold text-sm">{currSymbol}{Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                          <p className="text-slate-400 text-[10px]">{String(label)}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Savings Goal</h2>
                  <p className="text-slate-400 text-sm">What % of income do you want to save each month?</p>
                </div>
                <div className="text-center py-4">
                  <div className="text-6xl font-black text-emerald-400 emerald-text-glow mb-2">{savingsGoal}%</div>
                  <p className="text-slate-400 text-sm">= {currSymbol}{Math.round(income * savingsGoal / 100).toLocaleString('en-IN')}/month</p>
                </div>
                <input type="range" min="5" max="70" step="5" value={savingsGoal}
                  onChange={e => setValue('savingsGoal', parseInt(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>5% Minimal</span><span>20% Recommended</span><span>50%+ Aggressive</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map(v => (
                    <button key={v} type="button" onClick={() => setValue('savingsGoal', v)}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${savingsGoal === v ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'}`}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Budget Limits</h2>
                    <p className="text-slate-400 text-sm">Set monthly limits per category</p>
                  </div>
                  {income > 0 && (
                    <button type="button" onClick={applyRule}
                      className="text-xs px-3 py-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Auto-fill
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {CATEGORIES.slice(0, 9).map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-3 py-2.5 border border-slate-700/50">
                      <span className="text-lg w-7 text-center">{cat.emoji}</span>
                      <span className="text-sm text-slate-300 flex-1 truncate">{cat.label}</span>
                      <div className="relative w-28 flex-shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{currSymbol}</span>
                        <input type="number" placeholder="0"
                          value={budgetLimits[cat.id] ?? ''}
                          onChange={e => setBudgetLimits(prev => ({ ...prev, [cat.id]: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-700/40 border border-slate-600 rounded-lg pl-5 pr-2 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500/60" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">You can set limits for all categories in Settings → Budget</p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-900 font-bold text-sm transition-all flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold text-sm transition-all flex items-center justify-center gap-2">
                  {loading ? 'Setting up...' : <><Zap className="w-4 h-4" /> Launch BudgetOS</>}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
