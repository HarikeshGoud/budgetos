import { getDaysInMonth, getDate } from 'date-fns'

export function calcSavingsRate(income: number, totalExpenses: number): number {
  if (income <= 0) return 0
  return Math.max(0, ((income - totalExpenses) / income) * 100)
}

export function calcBudgetUtilization(spent: number, limit: number): number {
  if (limit <= 0) return 0
  return (spent / limit) * 100
}

export function calcDailyBurnRate(totalSpent: number, dayOfMonth: number): number {
  if (dayOfMonth <= 0) return 0
  return totalSpent / dayOfMonth
}

export function calcProjectedSpend(totalSpent: number, today: Date): number {
  const dayOfMonth = getDate(today)
  const daysInMonth = getDaysInMonth(today)
  const dailyBurn = calcDailyBurnRate(totalSpent, dayOfMonth)
  return dailyBurn * daysInMonth
}

export function calcMoMChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function calcRemainingBudget(income: number, spent: number): number {
  return Math.max(0, income - spent)
}

export function getBudgetStatus(utilization: number): 'safe' | 'warning' | 'danger' {
  if (utilization >= 100) return 'danger'
  if (utilization >= 80) return 'warning'
  return 'safe'
}

export function suggest5030(income: number) {
  return {
    needs: income * 0.5,
    wants: income * 0.3,
    savings: income * 0.2,
  }
}
