import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcSavingsRate } from '@/lib/calculations'

export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: true, data: [] })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const months: { month: number; year: number }[] = []
    for (let i = 11; i >= 0; i--) {
      let m = currentMonth - i, y = currentYear
      while (m <= 0) { m += 12; y -= 1 }
      months.push({ month: m, year: y })
    }

    const snapshots = await prisma.monthlySnapshot.findMany({ where: { userId: user.id } })
    const snapshotData = new Map(snapshots.map(s => [`${s.year}-${s.month}`, s]))

    type MonthEntry = {
      month: number; year: number; totalIncome: number; totalSpent: number; totalSaved: number; savingsRate: number
      categoryData: Record<string, { amount: number; pctOfTotal: number; pctOfIncome: number }>
    }
    const result: MonthEntry[] = []

    for (const { month, year } of months) {
      const key = `${year}-${month}`
      const isCurrentMonth = month === currentMonth && year === currentYear
      const snap = snapshotData.get(key)

      if (snap && !isCurrentMonth) {
        result.push({ month, year, totalIncome: snap.totalIncome, totalSpent: snap.totalSpent, totalSaved: snap.totalSaved, savingsRate: snap.savingsRate, categoryData: JSON.parse(snap.categoryData) })
        continue
      }

      const startOfMonth = new Date(year, month - 1, 1), endOfMonth = new Date(year, month, 0, 23, 59, 59)
      const [expenses, incomeAgg] = await Promise.all([
        prisma.expense.findMany({ where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } } }),
        prisma.income.aggregate({ where: { userId: user.id, month, year }, _sum: { amount: true } }),
      ])

      const totalIncome = incomeAgg._sum.amount ?? 0
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
      const totalSaved = totalIncome - totalSpent
      const savingsRate = calcSavingsRate(totalIncome, totalSpent)

      const categoryData: Record<string, { amount: number; pctOfTotal: number; pctOfIncome: number }> = {}
      for (const e of expenses) {
        if (!categoryData[e.category]) categoryData[e.category] = { amount: 0, pctOfTotal: 0, pctOfIncome: 0 }
        categoryData[e.category].amount += e.amount
      }
      for (const d of Object.values(categoryData)) {
        d.pctOfTotal = totalSpent > 0 ? (d.amount / totalSpent) * 100 : 0
        d.pctOfIncome = totalIncome > 0 ? (d.amount / totalIncome) * 100 : 0
      }

      if (!isCurrentMonth && (totalIncome > 0 || totalSpent > 0)) {
        await prisma.monthlySnapshot.upsert({
          where: { userId_month_year: { userId: user.id, month, year } },
          create: { userId: user.id, month, year, totalIncome, totalSpent, totalSaved, savingsRate, categoryData: JSON.stringify(categoryData) },
          update: { totalIncome, totalSpent, totalSaved, savingsRate, categoryData: JSON.stringify(categoryData) },
        })
      }

      result.push({ month, year, totalIncome, totalSpent, totalSaved, savingsRate, categoryData })
    }

    const withMom = result.map((r, i) => {
      const prev = i > 0 ? result[i - 1] : null
      return {
        ...r,
        momSpentChange: prev && prev.totalSpent > 0 ? ((r.totalSpent - prev.totalSpent) / prev.totalSpent) * 100 : null,
        momSavingsRateChange: prev ? r.savingsRate - prev.savingsRate : null,
      }
    })

    return NextResponse.json({ success: true, data: withMom })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: false, error: 'No user' })
    const now = new Date()
    const month = now.getMonth() + 1, year = now.getFullYear()
    const startOfMonth = new Date(year, month - 1, 1), endOfMonth = new Date(year, month, 0, 23, 59, 59)
    const [expenses, incomeAgg] = await Promise.all([
      prisma.expense.findMany({ where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.income.aggregate({ where: { userId: user.id, month, year }, _sum: { amount: true } }),
    ])
    const totalIncome = incomeAgg._sum.amount ?? 0
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
    const totalSaved = totalIncome - totalSpent
    const savingsRate = calcSavingsRate(totalIncome, totalSpent)
    const categoryData: Record<string, { amount: number; pctOfTotal: number; pctOfIncome: number }> = {}
    for (const e of expenses) {
      if (!categoryData[e.category]) categoryData[e.category] = { amount: 0, pctOfTotal: 0, pctOfIncome: 0 }
      categoryData[e.category].amount += e.amount
    }
    for (const d of Object.values(categoryData)) {
      d.pctOfTotal = totalSpent > 0 ? (d.amount / totalSpent) * 100 : 0
      d.pctOfIncome = totalIncome > 0 ? (d.amount / totalIncome) * 100 : 0
    }
    await prisma.monthlySnapshot.upsert({
      where: { userId_month_year: { userId: user.id, month, year } },
      create: { userId: user.id, month, year, totalIncome, totalSpent, totalSaved, savingsRate, categoryData: JSON.stringify(categoryData) },
      update: { totalIncome, totalSpent, totalSaved, savingsRate, categoryData: JSON.stringify(categoryData) },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
