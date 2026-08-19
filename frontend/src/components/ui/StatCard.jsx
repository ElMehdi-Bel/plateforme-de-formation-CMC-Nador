import { TrendingUp, TrendingDown } from 'lucide-react'

const config = {
  green:  { grad: 'from-primary-500 to-primary-700', border: 'border-l-primary-500', glow: 'shadow-glow-teal' },
  teal:   { grad: 'from-primary-400 to-primary-600', border: 'border-l-primary-400', glow: 'shadow-glow-teal' },
  blue:   { grad: 'from-blue-500 to-blue-600',       border: 'border-l-blue-500',    glow: '' },
  orange: { grad: 'from-accent-400 to-accent-600',   border: 'border-l-accent-500',  glow: '' },
  purple: { grad: 'from-purple-500 to-purple-600',   border: 'border-l-purple-500',  glow: '' },
  red:    { grad: 'from-red-500 to-red-600',         border: 'border-l-red-500',     glow: '' },
  amber:  { grad: 'from-amber-400 to-amber-600',     border: 'border-l-amber-500',   glow: '' },
}

export default function StatCard({ title, value, icon: Icon, color = 'green', trend, trendValue }) {
  const { grad, border } = config[color] ?? config.green
  const isUp   = trend === 'up'
  const isDown = trend === 'down'

  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-warm-100 border-l-4 ${border}
                  shadow-card hover:shadow-card-hover hover:-translate-y-0.5
                  transition-all duration-200 group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-warm-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="font-display text-3xl font-bold text-warm-900 mt-1.5 leading-none tabular-nums">
            {value}
          </p>
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold
                            ${isUp ? 'text-primary-600' : isDown ? 'text-red-500' : 'text-warm-400'}`}>
              {isUp   && <TrendingUp  size={12}/>}
              {isDown && <TrendingDown size={12}/>}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-br ${grad} flex-shrink-0 shadow-sm
                      group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon size={20} className="text-white"/>
        </div>
      </div>
    </div>
  )
}
