import type { Currency } from './format'

export const CURRENCY_STORAGE_KEY = 'llm-cost-lab.currency'
export const DEFAULT_CURRENCY: Currency = 'USD'

const CURRENCIES: readonly Currency[] = ['USD', 'XOF', 'EUR']

function isCurrency(value: string | null): value is Currency {
  return value !== null && CURRENCIES.includes(value as Currency)
}

/** Lit la devise mémorisée, avec la devise par défaut en cas de valeur invalide. */
export function readStoredCurrency(): Currency {
  try {
    const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY)
    return isCurrency(storedCurrency) ? storedCurrency : DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}

/** Mémorise la devise sans empêcher l’application de fonctionner si le stockage est indisponible. */
export function storeCurrency(currency: Currency): void {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
  } catch {
    // Le choix reste actif pour la visite en cours si le stockage est indisponible.
  }
}
