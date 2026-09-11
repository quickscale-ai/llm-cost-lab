/**
 * Helpers de formatage partagés.
 *
 * Toute valeur monétaire ou tout nombre de tokens affiché dans l'interface doit
 * passer par ces fonctions : c'est ce qui garantit un affichage cohérent d'un
 * composant à l'autre. Voir REVIEW.md.
 */

import { USD_TO_XOF } from '../data/models'

export type Currency = 'USD' | 'XOF' | 'EUR'

/** Parité fixe officielle : 1 EUR = 655,957 XOF (franc CFA arrimé à l'euro). */
export const XOF_PER_EUR = 655.957

/** Convertit un montant en dollars vers la devise demandée. */
export function convert(amountUsd: number, currency: Currency): number {
  if (currency === 'USD') return amountUsd
  if (currency === 'XOF') return amountUsd * USD_TO_XOF
  return (amountUsd * USD_TO_XOF) / XOF_PER_EUR
}

/**
 * Formate un montant (exprimé en dollars) dans la devise demandée.
 *
 * Le nombre de décimales s'adapte à l'ordre de grandeur : un coût de
 * 0,0004 $ doit rester lisible, un coût de 12 400 $ ne doit pas afficher de
 * centimes. Les valeurs non finies (NaN, Infinity) retournent un tiret plutôt
 * que « NaN » à l'écran.
 */
export function formatCurrency(amountUsd: number, currency: Currency): string {
  if (!Number.isFinite(amountUsd)) return '—'

  const value = convert(amountUsd, currency)
  const magnitude = Math.abs(value)

  // min/max vont par paire : un montant courant doit afficher ses deux
  // décimales (12,50 $ et non 12,5 $), un gros montant n'en affiche aucune.
  let minimumFractionDigits: number
  let maximumFractionDigits: number

  if (currency === 'XOF') {
    ;[minimumFractionDigits, maximumFractionDigits] = magnitude < 1 ? [2, 2] : [0, 0]
  } else if (magnitude === 0) {
    ;[minimumFractionDigits, maximumFractionDigits] = [0, 0]
  } else if (magnitude < 0.01) {
    ;[minimumFractionDigits, maximumFractionDigits] = [2, 6]
  } else if (magnitude < 1) {
    ;[minimumFractionDigits, maximumFractionDigits] = [2, 4]
  } else if (magnitude < 1000) {
    ;[minimumFractionDigits, maximumFractionDigits] = [2, 2]
  } else {
    ;[minimumFractionDigits, maximumFractionDigits] = [0, 0]
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/** Formate un nombre de tokens avec les séparateurs de milliers français. */
export function formatTokens(tokens: number): string {
  if (!Number.isFinite(tokens)) return '—'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(tokens)
}

/** Formate une fenêtre de contexte de façon compacte : 200K, 1M… */
export function formatContextWindow(tokens: number | null): string {
  if (tokens === null || !Number.isFinite(tokens)) return '—'
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(millions)} M`
  }
  return `${Math.round(tokens / 1000)} K`
}

/** Formate une date ISO (AAAA-MM-JJ) au format français JJ/MM/AAAA. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

/**
 * Convertit la saisie d'un champ numérique en nombre exploitable.
 *
 * Un champ vidé, une saisie non numérique ou une valeur négative retournent 0 :
 * les calculs de coût en aval ne doivent jamais recevoir NaN ni de valeur
 * négative. Voir REVIEW.md, section « Cas limites ».
 */
export function parseNumericInput(raw: string): number {
  const normalized = raw.replace(/\s/g, '').replace(',', '.')
  if (normalized === '') return 0
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}
