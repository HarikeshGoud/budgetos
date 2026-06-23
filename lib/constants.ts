export const CATEGORIES = [
  { id: 'food-dining',         label: 'Food & Dining',          emoji: '🍔', color: '#f97316', bg: 'bg-orange-500/20',  text: 'text-orange-400' },
  { id: 'transport-fuel',      label: 'Transport & Fuel',        emoji: '🚗', color: '#06b6d4', bg: 'bg-cyan-500/20',    text: 'text-cyan-400'   },
  { id: 'housing-rent',        label: 'Housing & Rent',          emoji: '🏠', color: '#8b5cf6', bg: 'bg-violet-500/20',  text: 'text-violet-400' },
  { id: 'utilities-bills',     label: 'Utilities & Bills',       emoji: '💡', color: '#eab308', bg: 'bg-yellow-500/20',  text: 'text-yellow-400' },
  { id: 'groceries',           label: 'Groceries',               emoji: '🛒', color: '#10b981', bg: 'bg-emerald-500/20', text: 'text-emerald-400'},
  { id: 'health-medical',      label: 'Health & Medical',        emoji: '🏥', color: '#ef4444', bg: 'bg-red-500/20',     text: 'text-red-400'    },
  { id: 'subscriptions-tech',  label: 'Subscriptions & Tech',    emoji: '📱', color: '#3b82f6', bg: 'bg-blue-500/20',    text: 'text-blue-400'   },
  { id: 'entertainment',       label: 'Entertainment & Leisure', emoji: '🎬', color: '#ec4899', bg: 'bg-pink-500/20',    text: 'text-pink-400'   },
  { id: 'shopping-clothing',   label: 'Shopping & Clothing',     emoji: '👗', color: '#f43f5e', bg: 'bg-rose-500/20',    text: 'text-rose-400'   },
  { id: 'education',           label: 'Education & Learning',    emoji: '📚', color: '#0ea5e9', bg: 'bg-sky-500/20',     text: 'text-sky-400'    },
  { id: 'gifts-donations',     label: 'Gifts & Donations',       emoji: '🎁', color: '#a855f7', bg: 'bg-purple-500/20',  text: 'text-purple-400' },
  { id: 'business-work',       label: 'Business & Work',         emoji: '💼', color: '#64748b', bg: 'bg-slate-500/20',   text: 'text-slate-400'  },
  { id: 'travel',              label: 'Travel',                  emoji: '✈️', color: '#14b8a6', bg: 'bg-teal-500/20',    text: 'text-teal-400'   },
  { id: 'savings-investments', label: 'Savings & Investments',   emoji: '💰', color: '#10b981', bg: 'bg-emerald-500/20', text: 'text-emerald-400'},
  { id: 'maintenance-repairs', label: 'Maintenance & Repairs',   emoji: '🔧', color: '#f59e0b', bg: 'bg-amber-500/20',   text: 'text-amber-400'  },
  { id: 'other',               label: 'Other / Miscellaneous',   emoji: '🧾', color: '#6b7280', bg: 'bg-gray-500/20',    text: 'text-gray-400'   },
]

export const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI' },
  { id: 'Cash', label: 'Cash' },
  { id: 'Credit Card', label: 'Credit Card' },
  { id: 'Debit Card', label: 'Debit Card' },
  { id: 'Net Banking', label: 'Net Banking' },
]

export const INCOME_SOURCES = [
  { id: 'salary', label: 'Salary' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'rental', label: 'Rental Income' },
  { id: 'business', label: 'Business' },
  { id: 'investment', label: 'Investment Returns' },
  { id: 'other', label: 'Other' },
]

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

export function getCurrency(code: string) {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0]
}

export function getCategoryById(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  const curr = getCurrency(currency)
  if (currency === 'INR') {
    return `${curr.symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  return `${curr.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export const NEEDS_CATEGORIES = ['housing-rent','utilities-bills','groceries','transport-fuel','health-medical']
export const WANTS_CATEGORIES = ['food-dining','entertainment','shopping-clothing','travel','gifts-donations','subscriptions-tech','education','business-work']
export const SAVINGS_CATEGORIES = ['savings-investments','other','maintenance-repairs']
