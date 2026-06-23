import { formatCurrency } from './constants'
import { calcProjectedSpend, calcMoMChange } from './calculations'
import { getDaysInMonth, getDate } from 'date-fns'

export type Insight = {
  type: 'alert' | 'tip' | 'info' | 'success'
  title: string
  body: string
  icon: string
}

interface InsightInput {
  income: number
  totalSpent: number
  savingsGoal: number
  currency: string
  categorySpending: Record<string, number>
  categoryLimits: Record<string, number>
  lastMonthCategorySpending: Record<string, number>
  lastMonthTotal: number
  today: Date
  recurringExpenses: { category: string; amount: number }[]
}

export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = []
  const { income, totalSpent, savingsGoal, currency, categorySpending, categoryLimits, lastMonthCategorySpending, lastMonthTotal, today } = input

  const fmt = (n: number) => formatCurrency(n, currency)
  const dayOfMonth = getDate(today)
  const daysInMonth = getDaysInMonth(today)
  const projected = calcProjectedSpend(totalSpent, today)
  const remaining = income - totalSpent
  const currentSavings = ((income - totalSpent) / income) * 100

  if (income > 0) {
    if (currentSavings >= savingsGoal) {
      insights.push({ type: 'success', title: 'On track for savings goal! 🎯', body: `You're saving ${currentSavings.toFixed(1)}% of income — above your ${savingsGoal}% goal. Keep it up!`, icon: '🏆' })
    } else {
      const shortfall = (savingsGoal / 100) * income - (income - totalSpent)
      insights.push({ type: 'alert', title: 'Savings goal at risk', body: `You need to spend ${fmt(shortfall)} less this month to hit your ${savingsGoal}% savings goal.`, icon: '⚠️' })
    }
  }

  if (income > 0 && projected > income * 0.9) {
    insights.push({ type: 'alert', title: 'Projected overspend', body: `At your current pace you'll spend ${fmt(projected)} this month — that's ${fmt(projected - income)} over your income.`, icon: '📈' })
  }

  for (const [cat, spent] of Object.entries(categorySpending)) {
    const limit = categoryLimits[cat]
    if (!limit) continue
    const pct = (spent / limit) * 100
    if (pct >= 100) {
      insights.push({ type: 'alert', title: `Over budget on ${cat.replace(/-/g, ' ')}`, body: `You've exceeded your ${fmt(limit)} budget — spent ${fmt(spent)} already.`, icon: '🚨' })
    } else if (pct >= 80 && dayOfMonth < 20) {
      insights.push({ type: 'alert', title: `${cat.replace(/-/g, ' ')} budget at ${pct.toFixed(0)}%`, body: `You've used ${fmt(spent)} of your ${fmt(limit)} budget with ${daysInMonth - dayOfMonth} days left.`, icon: '⚠️' })
    }
  }

  if (lastMonthTotal > 0 && totalSpent > 0) {
    const mom = calcMoMChange(totalSpent, lastMonthTotal)
    if (mom > 20) {
      insights.push({ type: 'alert', title: `Spending up ${mom.toFixed(0)}% vs last month`, body: `You've spent ${fmt(totalSpent - lastMonthTotal)} more than this time last month.`, icon: '📊' })
    } else if (mom < -10) {
      insights.push({ type: 'success', title: `Great job! Spending down ${Math.abs(mom).toFixed(0)}%`, body: `You've spent ${fmt(lastMonthTotal - totalSpent)} less than this time last month.`, icon: '📉' })
    }
  }

  for (const [cat, spent] of Object.entries(categorySpending)) {
    const last = lastMonthCategorySpending[cat] ?? 0
    if (last === 0) continue
    const change = calcMoMChange(spent, last)
    if (change > 40 && spent > 1000) {
      insights.push({ type: 'tip', title: `${cat.replace(/-/g, ' ')} up ${change.toFixed(0)}% vs last month`, body: `You spent ${fmt(spent - last)} more on ${cat.replace(/-/g, ' ')} compared to last month.`, icon: '💡' })
    }
  }

  const subscriptionSpend = categorySpending['subscriptions-tech'] ?? 0
  if (subscriptionSpend > 500) {
    insights.push({ type: 'tip', title: 'Review your subscriptions', body: `Subscriptions & tech are costing you ${fmt(subscriptionSpend)}/month — that's ${fmt(subscriptionSpend * 12)}/year.`, icon: '📱' })
  }

  const diningSpend = categorySpending['food-dining'] ?? 0
  if (diningSpend > 3000) {
    const savePerMonth = Math.round(diningSpend * 0.4)
    insights.push({ type: 'tip', title: 'Save by cooking at home', body: `You spent ${fmt(diningSpend)} dining out. Cooking at home 3x/week could save ~${fmt(savePerMonth)}/month (${fmt(savePerMonth * 12)}/year).`, icon: '🍳' })
  }

  if (remaining > 0 && income > 0) {
    insights.push({ type: 'info', title: `${fmt(remaining)} left for the month`, body: `You have ${((remaining / income) * 100).toFixed(1)}% of your income left with ${daysInMonth - dayOfMonth} days remaining.`, icon: '💵' })
  }

  return insights
}
