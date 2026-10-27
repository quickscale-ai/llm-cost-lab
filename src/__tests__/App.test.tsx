// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App, { PricingVerificationNotice } from '../App'
import { PricingTable } from '../components/PricingTable'
import { MODELS, PRICING_VERIFIED_AT } from '../data/models'
import { CURRENCY_STORAGE_KEY } from '../lib/currencyPreference'
import type { CostBreakdown } from '../lib/pricing'
import { computeCost } from '../lib/pricing'
import { formatCurrency, formatDate } from '../lib/format'
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
  window.location.hash = ''
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

function renderPricingTable(breakdowns: CostBreakdown[]) {
  mountedContainer = document.createElement('div')
  document.body.append(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() =>
    mountedRoot?.render(<PricingTable breakdowns={breakdowns} currency="USD" />),
  )
  return mountedContainer
}

function renderPricingVerificationNotice(verifiedAt?: string) {
  mountedContainer = document.createElement('div')
  document.body.append(mountedContainer)
  mountedRoot = createRoot(mountedContainer)
  act(() => mountedRoot?.render(<PricingVerificationNotice verifiedAt={verifiedAt} />))
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

describe('sélecteur de langue', () => {
  it('propose le français et l’anglais dans l’en-tête (C1)', () => {
    const container = renderApp()
    const languageGroup = container.querySelector('[role="group"][aria-label="Langue"]')

    expect(languageGroup).toBeTruthy()
    expect(buttonWithText(container, 'FR').getAttribute('aria-pressed')).toBe('true')
    expect(buttonWithText(container, 'EN').getAttribute('aria-pressed')).toBe('false')
  })

  it('traduit le titre et les en-têtes du tableau, puis revient au français (C3)', () => {
    const container = renderApp()
    const tableHeaders = () =>
      Array.from(container.querySelectorAll('table thead button')).map((button) => button.textContent ?? '')

    expect(container.querySelector('h1')?.textContent).toBe('Comparateur de coût par token')
    expect(tableHeaders().some((header) => header.includes('Modèle'))).toBe(true)

    act(() => buttonWithText(container, 'EN').click())

    expect(container.querySelector('h1')?.textContent).toBe('Token Cost Comparator')
    expect(tableHeaders().some((header) => header.includes('Model'))).toBe(true)
    expect(tableHeaders().some((header) => header.includes('Total cost'))).toBe(true)
    expect(container.textContent).toContain('Comparez le tarif des principaux modèles de langage')

    act(() => buttonWithText(container, 'FR').click())

    expect(container.querySelector('h1')?.textContent).toBe('Comparateur de coût par token')
    expect(tableHeaders().some((header) => header.includes('Coût total'))).toBe(true)
  })
})


describe('parcours du comparateur', () => {
  it('présente la configuration, la comparaison puis les résultats dans cet ordre (C1)', () => {
    const container = renderApp()

    expect(Array.from(container.querySelectorAll('h2')).map((heading) => heading.textContent?.trim())).toEqual([
      '1. Configurez votre simulation',
      'Coût mensuel par modèle',
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

describe('en-tête de la page', () => {
  it('conserve le titre de l’onglet sans y ajouter le nombre de modèles (C1)', () => {
    document.title = 'LLM Cost Lab — Comparateur de coût par token'

    renderApp()

    expect(document.title).toBe('LLM Cost Lab — Comparateur de coût par token')
  })

  it('affiche le nombre de modèles comparés et le met à jour par fournisseur (C2)', () => {
    const container = renderApp()
    const subtitle = container.querySelector('header > p:last-of-type')

    expect(subtitle?.textContent).toContain(`${MODELS.length} modèles comparés`)

    act(() => buttonWithText(container, 'Mistral AI').click())

    expect(subtitle?.textContent).toContain('2 modèles comparés')
  })
})

describe('carte de recommandation', () => {
  it('explique que le modèle recommandé a le coût estimé le plus bas pour l’usage simulé (C1)', () => {
    const container = renderApp()
    const recommendation = container.querySelector('[role="region"][aria-label="Modèle recommandé"]')
    if (!recommendation) throw new Error('Carte de recommandation introuvable')

    const explanation = recommendation.querySelector('div + p')

    expect(explanation?.textContent).toBe(
      'Ce modèle est recommandé car il présente le coût estimé le plus bas pour l’usage simulé.',
    )
    expect(explanation?.previousElementSibling?.tagName).toBe('DIV')
  })
})

describe('mise en évidence du modèle le moins cher', () => {
  it('affiche la pastille à côté du modèle le moins cher dans les vues tableau et mobile (C1)', () => {
    const container = renderApp()
    const table = container.querySelector('table')
    const mobileList = container.querySelector('ul')
    if (!table || !mobileList) throw new Error('Vues tarifaires introuvables')

    const tableBadges = table.querySelectorAll<HTMLElement>('[aria-label="Le moins cher"]')
    const mobileBadges = mobileList.querySelectorAll<HTMLElement>('[aria-label="Le moins cher"]')
    expect(tableBadges).toHaveLength(1)
    expect(mobileBadges).toHaveLength(1)
    const tableBadge = tableBadges[0]
    const mobileBadge = mobileBadges[0]
    expect(tableBadge?.textContent).toBe('Le moins cher')
    expect(mobileBadge?.textContent).toBe('Le moins cher')
    expect(tableBadge?.parentElement?.textContent).toContain('Mistral Small 4')
    expect(mobileBadge?.parentElement?.textContent).toContain('Mistral Small 4')
  })

  it('ne surligne pas la ligne du modèle le moins cher et conserve le survol (C2)', () => {
    const container = renderApp()
    const rows = Array.from(container.querySelectorAll<HTMLTableRowElement>('tbody tr'))
    const cheapestRow = rows.find((row) => row.querySelector('[aria-label="Le moins cher"]'))
    if (!cheapestRow) throw new Error('Ligne du modèle le moins cher introuvable')

    expect(cheapestRow.className).toContain('hover:bg-slate-50')
    expect(cheapestRow.className).not.toMatch(/emerald|brand-50/)
    expect(rows.every((row) => row.className === cheapestRow.className)).toBe(true)
  })

  it('affiche la pastille sur chaque modèle en cas d’égalité, y compris à zéro (C3)', () => {
    const tiedBreakdowns: CostBreakdown[] = MODELS.slice(0, 2).map((model) => ({
      model,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
    }))
    const container = renderPricingTable(tiedBreakdowns)
    const table = container.querySelector('table')
    const mobileList = container.querySelector('ul')
    if (!table || !mobileList) throw new Error('Vues tarifaires introuvables')

    expect(table.querySelectorAll('[aria-label="Le moins cher"]')).toHaveLength(2)
    expect(mobileList.querySelectorAll('[aria-label="Le moins cher"]')).toHaveLength(2)
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


describe('compteur de fournisseurs comparés', () => {
  it('affiche le nombre de fournisseurs distincts dans le pied de page, pas dans l’en-tête (C1)', () => {
    const container = renderApp()
    const header = container.querySelector('header')
    const footer = container.querySelector('footer')

    expect(footer?.textContent).toContain('7 fournisseurs comparés')
    expect(header?.textContent).not.toContain('fournisseurs comparés')
  })

  it('met à jour le nombre affiché lorsqu’un filtre de fournisseur est activé (C1)', () => {
    const container = renderApp()
    const footer = container.querySelector('footer')

    expect(footer?.textContent).toContain('7 fournisseurs comparés')
    act(() => buttonWithText(container, 'Mistral AI').click())
    expect(footer?.textContent).toContain('1 fournisseur comparé')
    expect(footer?.textContent).not.toContain('7 fournisseurs comparés')
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

describe('export du comparatif en CSV', () => {
  it('exporte uniquement les modèles visibles après un filtre et une recherche', async () => {
    let exportedBlob: Blob | undefined
    const originalCreateObjectURL = URL.createObjectURL
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        exportedBlob = blob
        return 'blob:comparatif'
      }),
    })
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const container = renderApp()

    act(() => buttonWithText(container, 'Mistral AI').click())
    changeSearch(container, 'small')
    const button = buttonWithText(container, 'Exporter en CSV')

    expect(button.getAttribute('type')).toBe('button')
    act(() => button.click())

    expect(anchorClick).toHaveBeenCalledTimes(1)
    expect(exportedBlob).toBeDefined()
    expect(await exportedBlob?.text()).toContain('Mistral Small 4')
    expect(await exportedBlob?.text()).not.toContain('Mistral Large 3')
    expect(await exportedBlob?.text()).not.toContain('Claude Fable 5.1')
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL })
  })

  it('exporte uniquement les en-têtes quand la recherche ne retourne aucun modèle', async () => {
    let exportedBlob: Blob | undefined
    const originalCreateObjectURL = URL.createObjectURL
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        exportedBlob = blob
        return 'blob:comparatif'
      }),
    })
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const container = renderApp()

    changeSearch(container, 'modèle inexistant')
    act(() => buttonWithText(container, 'Exporter en CSV').click())

    expect(anchorClick).toHaveBeenCalledTimes(1)
    expect(await exportedBlob?.text()).toBe(
      '\uFEFFModèle;Fournisseur;Prix / M entrée (USD);Prix / M sortie (USD);Contexte;Coût total (USD)',
    )
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL })
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

describe('pied de page', () => {
  it('affiche le copyright et conserve les autres contenus du pied de page (C1, C2)', () => {
    const container = renderApp()
    const footer = container.querySelector('footer')
    const copyright = Array.from(footer?.querySelectorAll('p') ?? []).find(
      (paragraph) => paragraph.textContent?.trim() === '© 2026 LLM Cost Lab, par Quickscale',
    )

    expect(copyright?.textContent?.trim()).toBe('© 2026 LLM Cost Lab, par Quickscale')
    expect(footer?.textContent).toContain('7 fournisseurs comparés')
    expect(footer?.textContent).toContain('Tarifs publics vérifiés le')
    expect(footer?.textContent).toContain(formatDate(PRICING_VERIFIED_AT))
    expect(footer?.textContent).toContain('Conversion en francs CFA au taux de')
    expect(footer?.querySelector('a[href="https://github.com/quickscale-ai/llm-cost-lab"]')?.textContent?.trim()).toBe('GitHub')
    expect(footer?.querySelector('a[href="#page-top"]')?.textContent?.trim()).toBe('Haut de page')
  })

  it('utilise des couleurs lisibles dans les thèmes clair et sombre (C2)', () => {
    const container = renderApp()
    const footer = container.querySelector('footer')
    const copyright = Array.from(footer?.querySelectorAll('p') ?? []).find(
      (paragraph) => paragraph.textContent?.trim() === '© 2026 LLM Cost Lab, par Quickscale',
    )

    expect(copyright?.className).toContain('text-slate-500')
    expect(copyright?.className).toContain('dark:text-slate-400')
  })

  it('affiche un lien GitHub vers le dépôt du projet (C1)', () => {
    const container = renderApp()
    const footer = container.querySelector('footer')
    const link = footer?.querySelector<HTMLAnchorElement>('a[href="https://github.com/quickscale-ai/llm-cost-lab"]')

    expect(link?.textContent?.trim()).toBe('GitHub')
    expect(link?.getAttribute('href')).toBe('https://github.com/quickscale-ai/llm-cost-lab')
  })

  it('ouvre le lien GitHub dans un nouvel onglet (C2)', () => {
    const container = renderApp()
    const footer = container.querySelector('footer')
    const link = footer?.querySelector<HTMLAnchorElement>('a[href="https://github.com/quickscale-ai/llm-cost-lab"]')

    expect(link?.getAttribute('target')).toBe('_blank')
  })
})

describe('date de relevé des prix', () => {
  it('affiche la date formatée sous le tableau (C1)', () => {
    const container = renderApp()
    const table = container.querySelector('table')
    const tableWrapper = table?.parentElement
    const notice = tableWrapper?.nextElementSibling

    expect(table).toBeTruthy()
    expect(notice?.textContent).toContain('Prix relevés le')
    expect(notice?.textContent).toContain(formatDate(PRICING_VERIFIED_AT))
    expect(notice?.parentElement?.contains(table)).toBe(true)
  })

  it('indique l’absence de date de relevé quand elle n’est pas disponible (C2)', () => {
    const container = renderPricingVerificationNotice()

    expect(container.textContent).toBe('Prix relevés : date non disponible.')
  })
})

describe('lien de retour en haut de page', () => {
  it('affiche dans le pied de page un lien accessible qui ramène à l’ancre supérieure (C1, C2)', () => {
    const container = renderApp()
    const pageTop = container.querySelector<HTMLElement>('#page-top')
    const footer = container.querySelector('footer')
    const link = footer?.querySelector<HTMLAnchorElement>('a[href="#page-top"]')

    expect(pageTop).toBeTruthy()
    expect(link).toBeTruthy()
    expect(link?.textContent?.trim()).toBe('Haut de page')
    expect(link?.tagName).toBe('A')
    expect(link?.getAttribute('href')).toBe('#page-top')
    expect(link?.tabIndex).toBe(0)

    act(() => link?.click())

    expect(window.location.hash).toBe('#page-top')
  })
})
