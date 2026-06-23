'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import { Insight } from '@/lib/insights'
import { AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react'

const TYPE_CONFIG = {
  alert:   { icon: AlertTriangle, bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400'    },
  success: { icon: CheckCircle,   bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400'},
  info:    { icon: Info,          bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400'   },
  tip:     { icon: Lightbulb,     bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400'  },
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insights').then(r => r.json()).then(j => {
      setInsights(j.data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Smart Insights</h1>
          <p className="text-slate-400 text-sm mt-0.5">Personalized recommendations based on your spending</p>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-12">Analyzing your finances...</div>
        ) : insights.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-white font-semibold mb-1">All looking great!</p>
            <p className="text-slate-400 text-sm">Add more expenses to get personalized insights.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const config = TYPE_CONFIG[insight.type]
              const Icon = config.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass-card rounded-2xl p-5 border ${config.border} ${config.bg}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.text}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${config.text} mb-1`}>{insight.title}</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{insight.body}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
