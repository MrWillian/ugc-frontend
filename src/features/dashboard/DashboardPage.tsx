import { useEffect, useState } from 'react'

import { MrrWidget } from '@/features/dashboard/widgets/mrr-widget'
import { fetchMrrMetric } from '@/mocks/metrics'

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [mrrBrl, setMrrBrl] = useState(0)
  const [monthOverMonthChange, setMonthOverMonthChange] = useState(0)

  useEffect(() => {
    let cancelled = false

    void fetchMrrMetric().then((snapshot) => {
      if (cancelled) return
      setMrrBrl(snapshot.mrrBrl)
      setMonthOverMonthChange(snapshot.monthOverMonthChange)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-svh flex-col px-6 py-10 text-left">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-h)]">
          Dashboard
        </h1>
        <p className="mt-1 text-[var(--text)]">
          Visão geral das métricas do produto.
        </p>
      </header>

      <div className="flex flex-wrap gap-6">
        <MrrWidget
          title="Receita recorrente mensal (MRR)"
          value={mrrBrl}
          trend={monthOverMonthChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
