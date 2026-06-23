'use client'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: number
  index?: number
}

export default function StatsCard({ title, value, sub, icon: Icon, iconColor = 'text-emerald-400', iconBg = 'bg-emerald-500/15', trend, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{title}</p>
          <p className="font-bold text-white leading-tight" style={{ fontSize: value.length > 10 ? '1.1rem' : value.length > 7 ? '1.4rem' : '1.5rem' }}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  )
}
