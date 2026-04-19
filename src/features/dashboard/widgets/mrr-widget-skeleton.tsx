import { Skeleton } from '@/components/ui/skeleton'

export function MrrWidgetSkeleton() {
  return (
    <section
      className="flex w-full max-w-sm flex-col rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-left shadow-sm"
      aria-busy="true"
      aria-label="Carregando receita recorrente mensal"
    >
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-4 h-10 w-52" />
      <Skeleton className="mt-3 h-4 w-36" />
    </section>
  )
}
