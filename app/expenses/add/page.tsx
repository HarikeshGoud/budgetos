'use client'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ExpenseForm from '@/components/expenses/ExpenseForm'
import { useEffect, useState } from 'react'

export default function AddExpensePage() {
  const router = useRouter()
  const [currency, setCurrency] = useState('INR')

  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then(j => { if (j.data?.currency) setCurrency(j.data.currency) })
  }, [])

  return (
    <AppShell>
      <div className="p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Add Expense</h1>
          <p className="text-slate-400 text-sm mt-1">Track where your money is going</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <ExpenseForm currency={currency} onSuccess={() => router.push('/expenses')} />
        </div>
      </div>
    </AppShell>
  )
}
