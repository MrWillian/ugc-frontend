import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { formatBrl } from '@/lib/format-currency'

import { MrrWidgetSkeleton } from './mrr-widget-skeleton'

export type MrrWidgetProps = {
  title: string
  value: number
  trend: number
  isLoading: boolean
}

function formatTrendPercent(fraction: number): string {
  const pct = fraction * 100
  const sign = pct > 0 ? '+' : ''
  const body = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(pct)
  return `${sign}${body}%`
}

export function MrrWidget({ title, value, trend, isLoading }: MrrWidgetProps) {
  if (isLoading) {
    return <MrrWidgetSkeleton />
  }

  const trendLabel = formatTrendPercent(trend)
  const trendPositive = trend > 0
  const trendNegative = trend < 0
  const trendClass = trendPositive
    ? 'text-green-600'
    : trendNegative
      ? 'text-red-600'
      : 'text-gray-600'

  const TrendIcon = trendPositive
    ? TrendingUp
    : trendNegative
      ? TrendingDown
      : Minus

  return (
    <section className="flex w-full max-w-sm flex-col rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-left shadow-sm">
      <h2 className="text-sm font-medium text-[var(--text)]">{title}</h2>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[var(--text-h)] tabular-nums">
        {formatBrl(value)}
      </p>
      <p
        className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${trendClass}`}
      >
        <TrendIcon className="size-4 shrink-0" aria-hidden />
        <span>{trendLabel}</span>
        <span className="font-normal text-[var(--text)]">vs. mês anterior</span>
      </p>
    </section>
  )
}
