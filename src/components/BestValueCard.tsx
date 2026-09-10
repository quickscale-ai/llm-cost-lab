import type { CostBreakdown } from '../lib/pricing'
import { computeSavings } from '../lib/pricing'
import type { Currency } from '../lib/format'
import { formatCurrency } from '../lib/format'

interface Props {
  breakdowns: CostBreakdown[]
  currency: Currency
}

/**
 * Carte de recommandation affichée au-dessus du tableau.
 *
 * Attend `breakdowns` triés du moins cher au plus cher (tels que retournés
 * par `rankByCost`). Affiche un état vide si la liste est vide.
 */
export function BestValueCard({ breakdowns, currency }: Props) {
  if (breakdowns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Aucun modèle ne correspond au filtre — la recommandation n'est pas disponible.
      </div>
    )
  }

  // breakdowns est trié du moins cher au plus cher par rankByCost
  const best = breakdowns[0]
  if (!best) return null
  const savings = computeSavings(breakdowns)

  return (
    <div
      role="region"
      aria-label="Modèle recommandé"
      className="rounded-xl border border-brand-100 bg-brand-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <p className="text-xs font-semibold tracking-[0.15em] uppercase text-brand-600 dark:text-brand-500">
        Meilleur rapport qualité-prix
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
            {best.model.name}
          </p>
          <a
            href={best.model.source}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block text-sm text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
          >
            {best.model.provider}
          </a>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-xl font-bold text-brand-600 dark:text-brand-500">
            {formatCurrency(best.totalCost, currency)}
          </p>
          {savings > 0 && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Économie de{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrency(savings, currency)}
              </span>{' '}
              vs le plus cher
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
