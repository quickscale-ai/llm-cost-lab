import type { Currency } from './format'
import { convert } from './format'
import type { CostBreakdown, Usage } from './pricing'
import { costPerTask } from './pricing'

export type SimulationMode = 'volume' | 'agentic'

export interface SimulationCsvOptions {
  mode: SimulationMode
  usage: Usage
  currency: Currency
  breakdowns: CostBreakdown[]
  tasksCount?: number
  callsCount?: number
}

const CSV_HEADERS = [
  'Simulation',
  'Tokens en entrée',
  'Tokens en sortie',
  'Tâches',
  'Appels',
  'Devise',
  'Modèle',
  'Fournisseur',
  'Tarif entrée / M tokens',
  'Tarif sortie / M tokens',
  'Coût entrée',
  'Coût sortie',
  'Coût total',
  'Coût / tâche',
  'Source',
]

/** Protège un texte CSV contre les séparateurs, guillemets et retours à la ligne. */
function csvText(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

/** Écrit un nombre avec une virgule décimale, sans séparateur de milliers. */
function csvNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return ''
  const rounded = Number(value.toPrecision(15))
  return new Intl.NumberFormat('fr-FR', {
    useGrouping: false,
    maximumFractionDigits: 12,
  }).format(rounded)
}

/**
 * Prépare le résultat courant au format CSV attendu par Excel français.
 *
 * Les montants sont exportés dans la devise sélectionnée et restent numériques
 * (sans symbole monétaire) pour faciliter les retraitements dans Excel.
 */
export function buildSimulationCsv({
  mode,
  usage,
  currency,
  breakdowns,
  tasksCount,
  callsCount,
}: SimulationCsvOptions): string {
  const rows = breakdowns.map(({ model, inputCost, outputCost, totalCost }) => {
    const taskCost = tasksCount === undefined ? undefined : costPerTask(totalCost, tasksCount)
    return [
      csvText(mode === 'agentic' ? 'Agentique' : 'Volume'),
      csvNumber(usage.inputTokens),
      csvNumber(usage.outputTokens),
      csvNumber(tasksCount),
      csvNumber(callsCount),
      csvText(currency),
      csvText(model.name),
      csvText(model.provider),
      csvNumber(convert(model.inputPerMTok, currency)),
      csvNumber(convert(model.outputPerMTok, currency)),
      csvNumber(convert(inputCost, currency)),
      csvNumber(convert(outputCost, currency)),
      csvNumber(convert(totalCost, currency)),
      csvNumber(taskCost === undefined ? undefined : convert(taskCost, currency)),
      csvText(model.source),
    ].join(';')
  })

  // BOM : Excel reconnaît correctement les accents du fichier UTF-8.
  return `\ufeff${CSV_HEADERS.join(';')}\r\n${rows.join('\r\n')}\r\n`
}
