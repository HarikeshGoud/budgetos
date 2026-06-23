import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcSavingsRate, calcMoMChange } from '@/lib/calculations'
import { getDaysInMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: true, data: null })

    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)
    const startOfPrev = new Date(prevYear, prevMonth - 1, 1)
    const endOfPrev = new Date(prevYear, prevMonth, 0, 23, 59, 59)

    const sixMonthsData = []
    for (let i = 5; i >= 0; i--) {
      let m = month - i, y = year
      if (m <= 0) { m += 12; y -= 1 }
      const s = new Date(y, m - 1, 1), e = new Date(y, m, 0, 23, 59, 59)
      const [expenses, income] = await Promise.all([
        prisma.expense.aggregate({ where: { userId: user.id, date: { gte: s, lte: e } }, _sum: { amount: true } }),
        prisma.income.aggregate({ where: { userId: user.id, month: m, year: y }, _sum: { amount: true } }),
      ])
      sixMonthsData.push({ month: m, year: y, spent: expenses._sum.amount ?? 0, income: income._sum.amount ?? 0 })
    }

    const [currentExpenses, prevExpenses, currentIncome] = await Promise.all([
      prisma.expense.findMany({ where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } }, orderBy: { date: 'asc' } }),
      prisma.expense.findMany({ where: { userId: user.id, date: { gte: startOfPrev, lte: endOfPrev } } }),
      prisma.income.findMany({ where: { userId: user.id, month, year } }),
    ])

    const totalIncome = currentIncome.reduce((s, i) => s + i.amount, 0)
    const totalSpent = currentExpenses.reduce((s, e) => s + e.amount, 0)
    const prevTotalSpent = prevExpenses.reduce((s, e) => s + e.amount, 0)

    const categorySpending: Record<string, number> = {}
    for (const e of currentExpenses) categorySpending[e.category] = (categorySpending[e.category] ?? 0) + e.amount
    const prevCategorySpending: Record<string, number> = {}
    for (const e of prevExpenses) prevCategorySpending[e.category] = (prevCategorySpending[e.category] ?? 0) + e.amount

    const daysInMonth = getDaysInMonth(new Date(year, month - 1))
    const dailyHeatmap = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }))
    for (const e of currentExpenses) {
      const day = e.date.getDate() - 1
      if (dailyHeatmap[day]) dailyHeatmap[day].amount += e.amount
    }

    const top5 = [...currentExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5)
    const categoryTable = Object.entries(categorySpending).map(([cat, spent]) => ({
      category: cat, spent,
      pctOfIncome: totalIncome > 0 ? (spent / totalIncome) * 100 : 0,
      pctOfTotal: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
      momChange: calcMoMChange(spent, prevCategorySpending[cat] ?? 0),
    })).sort((a, b) => b.spent - a.spent)

    return NextResponse.json({
      success: true,
      data: { month, year, totalIncome, totalSpent, netSavings: totalIncome - totalSpent,
        savingsRate: calcSavingsRate(totalIncome, totalSpent), momChange: calcMoMChange(totalSpent, prevTotalSpent),
        categorySpending, prevCategorySpending, categoryTable, dailyHeatmap, top5Expenses: top5, sixMonthsData,
        totalExpenseCount: currentExpenses.length },
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
