interface Props {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'xs'
}

const VARIANTS = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/15 text-red-400 border-red-500/20',
  info:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

export default function Badge({ children, variant = 'neutral', size = 'sm' }: Props) {
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${VARIANTS[variant]} ${size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
      {children}
    </span>
  )
}
