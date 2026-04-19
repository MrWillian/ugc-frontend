export type MrrSnapshot = {
  /** Valor de MRR em reais (BRL). */
  mrrBrl: number
  /** Variação mês a mês em fração (ex.: 0.052 = +5,2%). */
  monthOverMonthChange: number
}

const MOCK_MRR_SNAPSHOT: MrrSnapshot = {
  mrrBrl: 187_632.9,
  monthOverMonthChange: 0.052,
}

/**
 * Simula chamada à API de métricas (MRR).
 */
export function fetchMrrMetric(options?: {
  delayMs?: number
}): Promise<MrrSnapshot> {
  const delayMs = options?.delayMs ?? 900
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_MRR_SNAPSHOT), delayMs)
  })
}
