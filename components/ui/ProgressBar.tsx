'use client'
import { motion } from 'framer-motion'

interface Props {
  value: number
  max?: number
  color?: string
  height?: string
  showLabel?: boolean
  label?: string
  animate?: boolean
}

export default function ProgressBar({ value, max = 100, color, height = 'h-2', showLabel, label, animate = true }: Props) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor = color ?? (pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981')

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{label}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-slate-800 rounded-full overflow-hidden`}>
        {animate ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ background: barColor }}
            className="h-full rounded-full relative"
          >
            {pct > 20 && <div className="absolute inset-0 bg-white/10 rounded-full" />}
          </motion.div>
        ) : (
          <div style={{ width: `${pct}%`, background: barColor }} className="h-full rounded-full" />
        )}
      </div>
    </div>
  )
}
