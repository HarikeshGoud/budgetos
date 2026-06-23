import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInsights } from '@/lib/insights'

export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: true, data: [] })

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)
    const startOfPrev = new Date(prevYear, prevMonth - 1, 1)
    const endOfPrev = new Date(prevYear, prevMonth, 0, 23, 59, 59)

    const [currentIncome, currentExpenses, prevExpenses, budgetLimits] = await Promise.all([
      prisma.income.findMany({ where: { userId: user.id, month, year } }),
      prisma.expense.findMany({ where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.expense.findMany({ where: { userId: user.id, date: { gte: startOfPrev, lte: endOfPrev } } }),
      prisma.budgetLimit.findMany({ where: { userId: user.id } }),
    ])

    const totalIncome = currentIncome.reduce((s, i) => s + i.amount, 0)
    const totalSpent = currentExpenses.reduce((s, e) => s + e.amount, 0)
    const prevTotalSpent = prevExpenses.reduce((s, e) => s + e.amount, 0)

    const categorySpending: Record<string, number> = {}
    for (const e of currentExpenses) categorySpending[e.category] = (categorySpending[e.category] ?? 0) + e.amount
    const prevCategorySpending: Record<string, number> = {}
    for (const e of prevExpenses) prevCategorySpending[e.category] = (prevCategorySpending[e.category] ?? 0) + e.amount
    const limitsMap: Record<string, number> = {}
    for (const l of budgetLimits) limitsMap[l.category] = l.limit

    const insights = generateInsights({
      income: totalIncome, totalSpent, savingsGoal: user.savingsGoal, currency: user.currency,
      categorySpending, categoryLimits: limitsMap, lastMonthCategorySpending: prevCategorySpending,
      lastMonthTotal: prevTotalSpent, today: now, recurringExpenses: [],
    })

    return NextResponse.json({ success: true, data: insights })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
