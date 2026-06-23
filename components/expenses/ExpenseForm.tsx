'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/constants'
import { X, RefreshCw } from 'lucide-react'

const schema = z.object({
  amount: z.string().min(1).refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Must be positive'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  paymentMethod: z.string(),
  note: z.string().optional(),
  date: z.string(),
  isRecurring: z.boolean(),
})
type FormData = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
  onClose?: () => void
  initialData?: Partial<FormData & { id: number }>
  currency?: string
}

export default function ExpenseForm({ onSuccess, onClose, initialData, currency = 'INR' }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!initialData?.id

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: initialData?.amount ?? '',
      category: initialData?.category ?? '',
      subCategory: initialData?.subCategory ?? '',
      paymentMethod: initialData?.paymentMethod ?? 'UPI',
      note: initialData?.note ?? '',
      date: initialData?.date ?? format(new Date(), 'yyyy-MM-dd'),
      isRecurring: initialData?.isRecurring ?? false,
    },
  })

  const selectedCategory = watch('category')
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const url = isEdit ? `/api/expenses/${initialData!.id}` : '/api/expenses'
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(isEdit ? 'Expense updated!' : 'Expense added!')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {onClose && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 font-medium mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">{currencySymbol}</span>
          <input type="number" step="0.01" {...register('amount')} placeholder="0.00"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 pl-8 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all text-lg font-semibold" />
        </div>
        {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-xs text-slate-400 font-medium mb-1.5">Category</label>
        <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {CATEGORIES.map(c => (
            <label key={c.id} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer border transition-all text-center
              ${selectedCategory === c.id ? `${c.bg} border-current ${c.text}` : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              <input type="radio" {...register('category')} value={c.id} className="sr-only" />
              <span className="text-lg leading-none">{c.emoji}</span>
              <span className="text-[9px] font-medium leading-tight line-clamp-2">{c.label.split('&')[0].trim()}</span>
            </label>
          ))}
        </div>
        {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-1.5">Date</label>
          <input type="date" {...register('date')} className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-1.5">Payment</label>
          <select {...register('paymentMethod')} className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/60">
            {PAYMENT_METHODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 font-medium mb-1.5">Note <span className="text-slate-600">(optional)</span></label>
        <input type="text" {...register('note')} placeholder="e.g. Swiggy dinner, Petrol fill-up..."
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/60" />
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input type="checkbox" {...register('isRecurring')} className="sr-only peer" />
          <div className="w-10 h-5 bg-slate-700 rounded-full peer-checked:bg-emerald-500/60 transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
        </div>
        <span className="text-sm text-slate-300 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Mark as recurring monthly</span>
      </label>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold text-sm transition-all">
        {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}
      </button>
    </motion.form>
  )
}
