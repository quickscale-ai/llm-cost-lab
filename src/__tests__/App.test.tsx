// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { MODELS } from '../data/models'
import { CURRENCY_STORAGE_KEY } from '../lib/currencyPreference'
import { formatCurrency } from '../lib/format'
import { computeCost } from '../lib/pricing'

const printStylesheet = readFileSync('src/index.css', 'utf8')

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | undefined
let mountedContainer: HTMLDivElement | undefined

afterEach(() => {
  if (mountedRoot) act(() => mountedRoot?.unmount())
  mountedContainer?.remove()
  window.localStorage.removeItem(CURRENCY_STORAGE_KEY)
  document.title = 'LLM Cost Lab — Comparateur de coût par token'
  vi.restoreAllMocks()
  vi.useRealTimers()
  mountedRoot = undefined
  mountedContainer = undefined
})

function renderApp() {
  mountedContainer = document.createElement('div')
  document.body.append(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => mountedRoot?.render(<App />))
  return mountedContainer
}

function buttonWithText(container: HTMLDivElement, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  )
  if (!button) throw new Error(`Bouton introuvable : ${text}`)
  return button
}

function mockPrint() {
  const print = vi.fn()
  Object.defineProperty(window, 'print', { configurable: true, value: print })
  return print
}

function unmountApp() {
  if (mountedRoot) act(() => mountedRoot?.unmount())
  mountedContainer?.remove()
  mountedRoot = undefined
  mountedContainer = undefined
}

function changeSearch(container: HTMLDivElement, value: string) {
  const search = container.querySelector<HTMLInputElement>('#model-search')
  if (!search) throw new Error('Champ de recherche introuvable')
  act(() => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setValue?.call(search, value)
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  return search
}

function changeSelect(container: HTMLDivElement, id: string, value: string) {
  const select = container.querySelector<HTMLSelectElement>(`#${id}`)
  if (!select) throw new Error(`Sélecteur introuvable : ${id}`)
  act(() => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
    setValue?.call(select, value)
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  return select
}

describe('mémorisation de la devise', () => {
  it('utilise le dollar par défaut sans préférence enregistrée', () => {
    window.localStorage.removeItem(CURRENCY_STORAGE_KEY)
    const container = renderApp()

    expect(buttonWithText(container, 'USD').getAttribute('aria-pressed')).toBe('true')
  })

  it('retrouve la devise choisie après un rechargement', () => {
    const firstVisit = renderApp()
    act(() => buttonWithText(firstVisit, 'EUR').click())
    expect(window.localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('EUR')

    unmountApp()
    const secondVisit = renderApp()

    expect(buttonWithText(secondVisit, 'EUR').getAttribute('aria-pressed')).toBe('true')
  })

  it('revient au dollar si la préférence enregistrée est invalide', () => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, 'GBP')

    const container = renderApp()

    expect(buttonWithText(container, 'USD').getAttribute('aria-pressed')).toBe('true')
    expect(buttonWithText(container, 'EUR').getAttribute('aria-pressed')).toBe('false')
  })
})

describe('parcours du comparateur', () => {
  it('présente la configuration, la comparaison puis les résultats dans cet ordre (C1)', () => {
    const container = renderApp()

    expect(Array.from(container.querySelectorAll('h2')).map((heading) => heading.textContent?.trim())).toEqual([
      '1. Configurez votre simulation',
      '2. Comparez deux modèles',
      '3. Consultez les résultats',
    ])
  })

  it('affiche une différence mensuelle en euros et pourcentage, réactive aux changements (C3, C4)', () => {
    const container = renderApp()
    const comparisonSection = container.querySelector<HTMLElement>('[aria-labelledby="comparison-heading"]')
    if (!comparisonSection) throw new Error('Section de comparaison introuvable')
    const difference = comparisonSection.querySelector<HTMLElement>('[role="status"]')
    if (!difference) throw new Error('Zone de différence introuvable')

    expect(difference.getAttribute('aria-live')).toBe('polite')
    expect(difference.getAttribute('aria-label')).toContain('Différence mensuelle')
    expect(difference.textContent).toContain('€')
    expect(difference.textContent).toContain('%')
    const initialDifference = difference.textContent

    const firstSelect = comparisonSection.querySelector<HTMLSelectElement>('#comparison-first-model')
    const secondSelect = comparisonSection.querySelector<HTMLSelectElement>('#comparison-second-model')
    expect(firstSelect?.getAttribute('aria-label')).toBe('Premier modèle à comparer')
    expect(secondSelect?.getAttribute('aria-label')).toBe('Second modèle à comparer')
    expect(comparisonSection.querySelector('label[for="comparison-first-model"]')).toBeTruthy()
    expect(comparisonSection.querySelector('label[for="comparison-second-model"]')).toBeTruthy()

    changeSelect(container, 'comparison-first-model', 'mistral-large-3')
    expect(difference.textContent).not.toBe(initialDifference)
    expect(difference.textContent).toContain('€')
    expect(difference.textContent).toContain('%')

    const costsBeforeCurrencyChange = comparisonSection.textContent
    act(() => buttonWithText(container, 'EUR').click())
    expect(comparisonSection.textContent).not.toBe(costsBeforeCurrencyChange)
    expect(comparisonSection.textContent).toContain('€')
  })
})

function tableRowForModel(container: HTMLDivElement, name: string) {
  return Array.from(container.querySelectorAll<HTMLTableRowElement>('tbody tr')).find((row) =>
    row.querySelector('td')?.textContent?.includes(name),
  )
}

describe('recherche de modèle dans l’application', () => {
  it('affiche tous les modèles au rendu initial (C1, C3)', () => {
    const container = renderApp()

    expect(container.textContent).toContain('16 modèles affichés sur 16')
  })

  it('met à jour le compteur avec le fournisseur et la recherche, puis permet de l’effacer (C1, C2)', () => {
    const container = renderApp()

    act(() => buttonWithText(container, 'Mistral AI').click())
    expect(container.textContent).toContain('2 modèles affichés sur 2')
    const smallRowBefore = tableRowForModel(container, 'Mistral Small 4')
    const barBefore = smallRowBefore?.querySelector<HTMLElement>('[style]')?.style.width
    const search = changeSearch(container, 'small')
    expect(container.textContent).toContain('1 modèle affiché sur 2')
    const filteredTable = container.querySelector('table')
    expect(filteredTable?.textContent).toContain('Mistral Small 4')
    expect(filteredTable?.textContent).not.toContain('Mistral Large 3')
    expect(filteredTable?.textContent).not.toContain('Claude Fable 5.1')
    const recommendation = container.querySelector('[role="region"]')
    expect(recommendation?.textContent).toContain('Mistral Small 4')
    expect(recommendation?.textContent).not.toContain('Mistral Large 3')
    expect(tableRowForModel(container, 'Mistral Small 4')?.querySelector<HTMLElement>('[style]')?.style.width).toBe(
      barBefore,
    )

    act(() => buttonWithText(container, '10 K / 2 K').click())
    const mistralSmall = MODELS.find((model) => model.id === 'mistral-small-4')
    if (!mistralSmall) throw new Error('Modèle Mistral Small 4 introuvable')
    const expectedRecommendationCost = computeCost(mistralSmall, {
      inputTokens: 10_000,
      outputTokens: 2_000,
    })
    expect(recommendation?.textContent).toContain(formatCurrency(expectedRecommendationCost.totalCost, 'USD'))

    expect(search.type).toBe('text')
    expect(search.inputMode).toBe('search')
    expect(search.className).toContain('text-base')
    const clearButton = container.querySelector<HTMLButtonElement>('[aria-label="Effacer la recherche"]')
    if (!clearButton) throw new Error('Bouton d’effacement introuvable')
    expect(clearButton.className).toContain('min-h-11')
    expect(clearButton.className).toContain('min-w-11')
    act(() => clearButton.click())

    expect(search.value).toBe('')
    expect(document.activeElement).toBe(search)
    expect(container.textContent).toContain('2 modèles affichés sur 2')
    const tableAfterClear = container.querySelector('table')
    expect(tableAfterClear?.textContent).toContain('Mistral Large 3')
    expect(tableAfterClear?.textContent).toContain('Mistral Small 4')
    expect(tableAfterClear?.textContent).not.toContain('Claude Fable 5.1')
  })

  it('affiche un seul message accessible avec le terme quand la recherche ne retourne aucun modèle', () => {
    const container = renderApp()
    const query = 'modèle inexistant'

    changeSearch(container, query)

    expect(container.textContent).toContain('0 modèles affichés sur 16')
    expect(container.querySelector('table')).toBeNull()
    const statuses = Array.from(container.querySelectorAll<HTMLElement>('[role="status"]'))
    const emptyResultsStatus = statuses.filter((status) => status.textContent?.includes(query))
    expect(emptyResultsStatus).toHaveLength(1)
    expect(emptyResultsStatus[0]?.textContent).toContain(query)
    expect(container.querySelector('[role="region"]')).toBeNull()
    expect(container.textContent).not.toContain("la recommandation n'est pas disponible")
  })
})

describe('réinitialisation globale des filtres', () => {
  function resetButton(container: HTMLDivElement) {
    return Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Réinitialiser les filtres',
    )
  }

  it('affiche le bouton uniquement lorsqu’un fournisseur ou une recherche est actif (C2)', () => {
    const container = renderApp()

    expect(resetButton(container)).toBeUndefined()

    act(() => buttonWithText(container, 'Mistral AI').click())
    expect(resetButton(container)).toBeTruthy()

    act(() => buttonWithText(container, 'Réinitialiser les filtres').click())
    expect(resetButton(container)).toBeUndefined()

    changeSearch(container, 'small')
    expect(resetButton(container)).toBeTruthy()
  })

  it('remet les deux filtres à zéro et restaure le tableau complet (C1, C3)', () => {
    const container = renderApp()

    act(() => buttonWithText(container, 'Mistral AI').click())
    changeSearch(container, 'small')
    expect(container.textContent).toContain('1 modèle affiché sur 2')

    act(() => buttonWithText(container, 'Réinitialiser les filtres').click())

    const allProvidersButton = buttonWithText(container, 'Tous')
    expect(allProvidersButton.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector<HTMLInputElement>('#model-search')?.value).toBe('')
    expect(container.textContent).toContain('16 modèles affichés sur 16')
    expect(container.querySelectorAll('tbody tr')).toHaveLength(16)
    expect(resetButton(container)).toBeUndefined()
  })
})

describe('export du comparatif en PDF', () => {
  it('marque le tableau affiché et masque le reste de la page à l’impression (C1)', () => {
    const container = renderApp()

    expect(container.querySelector('table')?.classList.contains('pricing-table-print')).toBe(true)
    expect(printStylesheet).toContain('@media print')
    expect(printStylesheet).toMatch(/body \*\s*\{[\s\S]*visibility: hidden !important/)
    expect(printStylesheet).toMatch(/\.pricing-table-print,[\s\S]*visibility: visible !important/)
  })

  it('ajoute la date au titre avant d’ouvrir la boîte d’impression (C2)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 31, 12, 0, 0))
    const print = vi.fn(() => {
      expect(document.title).toContain('2026-01-31')
    })
    Object.defineProperty(window, 'print', { configurable: true, value: print })
    const container = renderApp()

    act(() => buttonWithText(container, 'Exporter en PDF').click())

    expect(document.title).toContain('2026-01-31')
    expect(print).toHaveBeenCalledOnce()
  })

  it('affiche un bouton accessible qui déclenche l’impression (C3)', () => {
    const print = mockPrint()
    const container = renderApp()

    const button = buttonWithText(container, 'Exporter en PDF')
    expect(button.getAttribute('type')).toBe('button')

    act(() => button.click())

    expect(print).toHaveBeenCalledOnce()
  })
})
