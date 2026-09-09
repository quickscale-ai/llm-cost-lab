import { useMemo, useState } from 'react'
import type { CostBreakdown } from '../lib/pricing'
import { maxTotalCost } from '../lib/pricing'
import type { Currency } from '../lib/format'
import { formatContextWindow, formatCurrency } from '../lib/format'

type SortKey = 'cost' | 'name' | 'input' | 'output' | 'context'

interface Props {
  breakdowns: CostBreakdown[]
  currency: Currency
}

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Modèle', align: 'left' },
  { key: 'input', label: '$ / M entrée', align: 'right' },
  { key: 'output', label: '$ / M sortie', align: 'right' },
  { key: 'context', label: 'Contexte', align: 'right' },
  { key: 'cost', label: 'Coût estimé', align: 'right' },
]

function sortValue(breakdown: CostBreakdown, key: SortKey): number | string {
  switch (key) {
    case 'name':
      return breakdown.model.name
    case 'input':
      return breakdown.model.inputPerMTok
    case 'output':
      return breakdown.model.outputPerMTok
    case 'context':
      return breakdown.model.contextWindow ?? -1
    case 'cost':
      return breakdown.totalCost
  }
}

/** Barre de coût relative : rend le classement lisible d'un coup d'œil. */
function CostBar({ ratio }: { ratio: number }) {
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className="h-full rounded-full bg-brand-500"
        style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 2 : 0)}%` }}
      />
    </div>
  )
}

function TierNote({ note }: { note: string }) {
  return (
    <abbr
      title={note}
      aria-label={note}
      className="ml-1 cursor-help rounded border border-slate-300 px-1 text-[10px] leading-tight text-slate-500 no-underline dark:border-slate-700 dark:text-slate-400"
    >
      i
    </abbr>
  )
}

export function PricingTable({ breakdowns, currency }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('cost')
  const [ascending, setAscending] = useState(true)

  const sorted = useMemo(() => {
    return [...breakdowns].sort((a, b) => {
      const left = sortValue(a, sortKey)
      const right = sortValue(b, sortKey)
      const delta =
        typeof left === 'string' && typeof right === 'string'
          ? left.localeCompare(right, 'fr')
          : Number(left) - Number(right)
      return ascending ? delta : -delta
    })
  }, [breakdowns, sortKey, ascending])

  const ceiling = maxTotalCost(breakdowns)

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAscending((previous) => !previous)
    } else {
      setSortKey(key)
      setAscending(key !== 'context')
    }
  }

  if (breakdowns.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Aucun modèle ne correspond au filtre sélectionné.
      </p>
    )
  }

  return (
    <>
      {/* Vue tableau — écrans larges */}
      <table className="hidden w-full border-collapse text-sm md:table">
        <caption className="sr-only">
          Tarifs et coût estimé par modèle, classés par {sortKey === 'cost' ? 'coût' : 'colonne sélectionnée'}
        </caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {COLUMNS.map((column) => {
              const active = column.key === sortKey
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (ascending ? 'ascending' : 'descending') : 'none'}
                  className={`py-2 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className={`text-xs font-semibold tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                      active
                        ? 'text-brand-700 dark:text-brand-500'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {column.label}
                    <span aria-hidden="true"> {active ? (ascending ? '↑' : '↓') : ''}</span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((breakdown) => {
            const { model } = breakdown
            return (
              <tr
                key={model.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-900/40"
              >
                <td className="py-2.5 pr-4">
                  <div className="font-medium text-slate-900 dark:text-slate-50">
                    {model.name}
                    {model.tierNote ? <TierNote note={model.tierNote} /> : null}
                  </div>
                  <a
                    href={model.source}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
                  >
                    {model.provider}
                  </a>
                </td>
                <td className="tabular py-2.5 text-right text-slate-600 dark:text-slate-400">
                  {formatCurrency(model.inputPerMTok, currency)}
                </td>
                <td className="tabular py-2.5 text-right text-slate-600 dark:text-slate-400">
                  {formatCurrency(model.outputPerMTok, currency)}
                </td>
                <td className="tabular py-2.5 text-right text-slate-600 dark:text-slate-400">
                  {formatContextWindow(model.contextWindow)}
                </td>
                <td className="py-2.5 pl-4 text-right align-middle">
                  <div className="tabular font-semibold text-slate-900 dark:text-slate-50">
                    {formatCurrency(breakdown.totalCost, currency)}
                  </div>
                  <CostBar ratio={ceiling > 0 ? breakdown.totalCost / ceiling : 0} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Vue cartes — mobile. Un tableau à 5 colonnes est illisible à 360 px. */}
      <ul className="space-y-2 md:hidden">
        {sorted.map((breakdown) => {
          const { model } = breakdown
          return (
            <li
              key={model.id}
              className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-50">
                    {model.name}
                    {model.tierNote ? <TierNote note={model.tierNote} /> : null}
                  </div>
                  <a
                    href={model.source}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
                  >
                    {model.provider}
                  </a>
                </div>
                <div className="tabular shrink-0 text-right font-semibold text-slate-900 dark:text-slate-50">
                  {formatCurrency(breakdown.totalCost, currency)}
                </div>
              </div>
              <CostBar ratio={ceiling > 0 ? breakdown.totalCost / ceiling : 0} />
              <dl className="tabular mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex gap-1">
                  <dt>Entrée</dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    {formatCurrency(model.inputPerMTok, currency)}/M
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt>Sortie</dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    {formatCurrency(model.outputPerMTok, currency)}/M
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt>Contexte</dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    {formatContextWindow(model.contextWindow)}
                  </dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </>
  )
}
