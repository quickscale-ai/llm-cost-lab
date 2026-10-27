import type { Model } from '../data/models'
import type { CostBreakdown, CostComparison } from '../lib/pricing'
import type { Currency } from '../lib/format'
import { formatCurrency } from '../lib/format'

interface Props {
  models: Model[]
  firstModelId: string | undefined
  secondModelId: string | undefined
  onFirstModelChange: (id: string) => void
  onSecondModelChange: (id: string) => void
  firstCost: CostBreakdown | undefined
  secondCost: CostBreakdown | undefined
  comparison: CostComparison | undefined
  currency: Currency
}

const selectClassName =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50'

export function ModelComparison({
  models,
  firstModelId,
  secondModelId,
  onFirstModelChange,
  onSecondModelChange,
  firstCost,
  secondCost,
  comparison,
  currency,
}: Props) {
  const hasTwoModels = models.length >= 2

  return (
    <section
      aria-labelledby="comparison-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="comparison-heading" className="text-base font-semibold">
        2. Comparez deux modèles
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Sélectionnez deux modèles pour comparer leur coût mensuel selon la simulation.
      </p>

      {!hasTwoModels ? (
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Sélectionnez au moins deux modèles visibles pour comparer leurs coûts.
        </p>
      ) : firstCost && secondCost && comparison ? (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Différence mensuelle entre les deux modèles sélectionnés"
          className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-500">
            Différence de coût mensuel
          </p>
          {comparison.cheaper === 'equal' ? (
            <p className="mt-1 font-medium">
              Les deux modèles ont le même coût estimé :{' '}
              <span className="tabular">{formatCurrency(comparison.difference, 'EUR')}</span> (0 %).
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              <span className="font-semibold">
                {comparison.cheaper === 'first' ? firstCost.model.name : secondCost.model.name}
              </span>{' '}
              est le moins cher :{' '}
              <span className="tabular font-semibold">{formatCurrency(comparison.difference, 'EUR')}</span>{' '}
              ({comparison.percentage.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %).
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Écart calculé pour l&apos;usage simulé ; les coûts détaillés ci-dessous suivent la devise choisie.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="comparison-first-model" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Premier modèle
          </label>
          <select
            id="comparison-first-model"
            name="comparison-first-model"
            aria-label="Premier modèle à comparer"
            value={firstModelId ?? ''}
            onChange={(event) => onFirstModelChange(event.target.value)}
            className={selectClassName}
            disabled={models.length === 0}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id} disabled={model.id === secondModelId}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="comparison-second-model" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Second modèle
          </label>
          <select
            id="comparison-second-model"
            name="comparison-second-model"
            aria-label="Second modèle à comparer"
            value={secondModelId ?? ''}
            onChange={(event) => onSecondModelChange(event.target.value)}
            className={selectClassName}
            disabled={models.length === 0}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id} disabled={model.id === firstModelId}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasTwoModels && firstCost && secondCost && comparison ? (
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Coûts estimés par modèle</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <CostCard label={firstCost.model.name} amount={firstCost.totalCost} currency={currency} />
            <CostCard label={secondCost.model.name} amount={secondCost.totalCost} currency={currency} />
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CostCard({ label, amount, currency }: { label: string; amount: number; currency: Currency }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <p className="truncate text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold">{formatCurrency(amount, currency)}</p>
    </div>
  )
}
