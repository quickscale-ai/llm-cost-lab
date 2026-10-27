// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { MODELS } from '../data/models'
import { CURRENCY_STORAGE_KEY } from '../lib/currencyPreference'
import { computeCost } from '../lib/pricing'
import { formatCurrency } from '../lib/format'
import { MonthlyCostChart } from '../components/MonthlyCostChart'

const printStylesheet = readFileSync('src/index.css', 'utf8')

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | undefined
let mountedContainer: HTMLDivElement | undefined

const defaultInnerWidth = window.innerWidth

afterEach(() => {
  if (mountedRoot) act(() => mountedRoot?.unmount())
  mountedContainer?.remove()
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: defaultInnerWidth })
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

function tableRowForModel(container: HTMLDivElement, name: string) {
  return Array.from(container.querySelectorAll<HTMLTableRowElement>('tbody tr')).find((row) =>
    row.querySelector('td')?.textContent?.includes(name),
  )
}

function monthlyChart(container: HTMLDivElement) {
  const chart = container.querySelector<HTMLElement>('[aria-labelledby="monthly-cost-chart-heading"]')
  if (!chart) throw new Error('Graphique des coûts introuvable')
  return chart
}

describe('graphique des coûts mensuels', () => {
  it('est placé après le simulateur et affiche une barre par modèle visible (C1, C2)', () => {
    const container = renderApp()
    const sections = Array.from(container.querySelectorAll('section')).map((section) => section.getAttribute('aria-labelledby'))
    const chart = monthlyChart(container)

    expect(sections).toEqual(['simulator-heading', 'monthly-cost-chart-heading', 'comparison-heading', 'results-heading'])
    expect(chart.querySelector('svg')?.getAttribute('role')).toBe('img')
    expect(chart.querySelector('svg')?.getAttribute('aria-labelledby')).toBe(
      'monthly-cost-chart-title monthly-cost-chart-description',
    )
    expect(chart.querySelectorAll('[data-model-id]')).toHaveLength(MODELS.length)
    const usage = { inputTokens: 100_000, outputTokens: 20_000 }
    for (const model of MODELS) {
      const group = chart.querySelector(`[data-model-id="${model.id}"]`)
      const expectedCost = computeCost(model, usage).totalCost

      expect(group).toBeTruthy()
      expect(group?.querySelector('rect[data-cost]')?.getAttribute('data-cost')).toBe(String(expectedCost))
      expect(group?.textContent).toContain(formatCurrency(expectedCost, 'USD'))
    }
  })

  it('tronque les noms longs sans masquer leur intitulé complet', () => {
    const baseModel = MODELS[0]
    if (!baseModel) throw new Error('Modèle de test introuvable')
    const longName = 'Modèle de langage avec un nom particulièrement long pour mobile'
    const longModel = { ...baseModel, id: 'long-name-model', name: longName }
    const breakdown = computeCost(longModel, { inputTokens: 100_000, outputTokens: 20_000 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })

    mountedContainer = document.createElement('div')
    document.body.append(mountedContainer)
    mountedRoot = createRoot(mountedContainer)
    act(() => mountedRoot?.render(<MonthlyCostChart breakdowns={[breakdown]} currency="USD" />))

    const group = mountedContainer.querySelector('[data-model-id]')
    const label = group?.querySelector('text')
    expect(label?.textContent).toBe('Modèle de langage…')
    expect(group?.querySelector('title')?.textContent).toContain(longName)
  })

  it('conserve une taille de texte lisible sur mobile sans élargir le graphique', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })
    const container = renderApp()
    const svg = monthlyChart(container).querySelector('svg')

    expect(svg?.getAttribute('viewBox')).toMatch(/^0 0 360 /)
    expect(svg?.querySelector('text')?.getAttribute('textLength')).toBeNull()
    expect(svg?.querySelector('text')?.getAttribute('class')).toContain('text-[14px]')
  })

  it('suit les filtres, le mode de simulation et la devise (C3, C4)', () => {
    const container = renderApp()
    const chart = monthlyChart(container)
    const initialValues = chart.textContent

    act(() => buttonWithText(container, 'Mistral AI').click())
    expect(chart.querySelectorAll('[data-model-id]')).toHaveLength(2)
    changeSearch(container, 'small')
    expect(chart.querySelectorAll('[data-model-id]')).toHaveLength(1)
    expect(chart.querySelector('[data-model-id="mistral-small-4"]')).toBeTruthy()

    const volumeValues = chart.textContent
    act(() => buttonWithText(container, 'Estimation agentic').click())
    expect(chart.textContent).not.toBe(volumeValues)
    expect(chart.textContent).not.toBe(initialValues)
    const agenticValues = chart.textContent
    const displayedModel = MODELS.find((model) => model.id === 'mistral-small-4')
    if (!displayedModel) throw new Error('Modèle affiché introuvable')
    const agenticCost = computeCost(displayedModel, {
      inputTokens: 50 * 10 * 8_000,
      outputTokens: 50 * 10 * 1_500,
    }).totalCost

    act(() => buttonWithText(container, 'FCFA').click())
    expect(chart.textContent).not.toBe(agenticValues)
    expect(chart.textContent).toContain(formatCurrency(agenticCost, 'XOF'))
    expect(chart.querySelector('svg')?.getAttribute('aria-labelledby')).toBeTruthy()
  })
})

describe('recherche de modèle dans l’application', () => {
  it('affiche tous les modèles au rendu initial (C1, C3)', () => {
    const container = renderApp()

    expect(container.textContent).toContain('16 modèles affichés sur 16')
  })

  it('met à jour le compteur avec le fournisseur et la recherche, puis permet de l’effacer (C1, C2)', () => {
    const container = renderApp()

    act(() => buttonWithText(container, 'Mistral AI').click())
    expect(container.textContent).toContain('2 modèles affichés sur 2')
    const recommendationBefore = container.querySelector('[role="region"]')?.textContent
    const smallRowBefore = tableRowForModel(container, 'Mistral Small 4')
    const barBefore = smallRowBefore?.querySelector<HTMLElement>('[style]')?.style.width
    const search = changeSearch(container, 'small')
    expect(container.textContent).toContain('1 modèle affiché sur 2')
    const filteredTable = container.querySelector('table')
    expect(filteredTable?.textContent).toContain('Mistral Small 4')
    expect(filteredTable?.textContent).not.toContain('Mistral Large 3')
    expect(filteredTable?.textContent).not.toContain('Claude Fable 5.1')
    expect(container.querySelector('[role="region"]')?.textContent).toBe(recommendationBefore)
    expect(tableRowForModel(container, 'Mistral Small 4')?.querySelector<HTMLElement>('[style]')?.style.width).toBe(
      barBefore,
    )

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
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(container.querySelector('[role="status"]')?.textContent).toContain(query)
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
