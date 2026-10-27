import type { CostBreakdown } from './pricing'
import { costPerTask } from './pricing'
import type { Currency } from './format'
import { formatContextWindow, formatCurrency } from './format'

export type CsvCell = string | number | null | undefined

const DEFAULT_SEPARATOR = ';'
export const PRICING_CSV_FILENAME = 'comparatif-modeles.csv'

/** Protège une valeur CSV lorsqu'elle contient un séparateur, un guillemet ou un retour à la ligne. */
export function escapeCsvCell(value: CsvCell, separator = DEFAULT_SEPARATOR): string {
  const text = value == null ? '' : String(value)
  if (!text.includes(separator) && !text.includes('"') && !text.includes('\r') && !text.includes('\n')) return text
  return `"${text.replaceAll('"', '""')}"`
}

/** Convertit des lignes en CSV UTF-8 séparé par des points-virgules. */
export function toCsv(rows: readonly (readonly CsvCell[])[], separator = DEFAULT_SEPARATOR): string {
  return rows.map((row) => row.map((cell) => escapeCsvCell(cell, separator)).join(separator)).join('\r\n')
}

/** Construit le CSV des lignes de prix actuellement visibles dans le tableau. */
export function buildPricingCsv(
  breakdowns: readonly CostBreakdown[],
  currency: Currency,
  tasksCount?: number,
): string {
  const hasCostPerTask = (tasksCount ?? 0) > 0
  const currencyLabel = currency
  const headers = [
    'Modèle',
    'Fournisseur',
    `Prix / M entrée (${currencyLabel})`,
    `Prix / M sortie (${currencyLabel})`,
    'Contexte',
    `Coût total (${currencyLabel})`,
    ...(hasCostPerTask ? [`Coût / tâche (${currencyLabel})`] : []),
  ]

  const rows = breakdowns.map(({ model, totalCost }) => [
    model.name,
    model.provider,
    formatCurrency(model.inputPerMTok, currency),
    formatCurrency(model.outputPerMTok, currency),
    formatContextWindow(model.contextWindow),
    formatCurrency(totalCost, currency),
    ...(hasCostPerTask ? [formatCurrency(costPerTask(totalCost, tasksCount ?? 0), currency)] : []),
  ])

  return toCsv([headers, ...rows])
}

/** Déclenche le téléchargement d'un fichier CSV dans le navigateur. */
export function downloadCsv(csv: string, filename = PRICING_CSV_FILENAME): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const objectUrl =
    typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(blob)
      : `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()

  if (typeof URL.revokeObjectURL === 'function' && objectUrl.startsWith('blob:')) {
    URL.revokeObjectURL(objectUrl)
  }
}
