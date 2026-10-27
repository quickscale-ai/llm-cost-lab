// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../App'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let mountedRoot: Root | undefined
let mountedContainer: HTMLDivElement | undefined

afterEach(() => {
  if (mountedRoot) act(() => mountedRoot?.unmount())
  mountedContainer?.remove()
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

function tableRowForModel(container: HTMLDivElement, name: string) {
  return Array.from(container.querySelectorAll<HTMLTableRowElement>('tbody tr')).find((row) =>
    row.querySelector('td')?.textContent?.includes(name),
  )
}

describe('recherche de modèle dans l’application', () => {
  it('combine la recherche avec le fournisseur, conserve le résumé et l’échelle des barres, puis permet de l’effacer', () => {
    const container = renderApp()

    act(() => buttonWithText(container, 'Mistral AI').click())
    const recommendationBefore = container.querySelector('[role="region"]')?.textContent
    const smallRowBefore = tableRowForModel(container, 'Mistral Small 4')
    const barBefore = smallRowBefore?.querySelector<HTMLElement>('[style]')?.style.width
    const search = changeSearch(container, 'small')
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
    const tableAfterClear = container.querySelector('table')
    expect(tableAfterClear?.textContent).toContain('Mistral Large 3')
    expect(tableAfterClear?.textContent).toContain('Mistral Small 4')
    expect(tableAfterClear?.textContent).not.toContain('Claude Fable 5.1')
  })

  it('affiche un seul message accessible avec le terme quand la recherche ne retourne aucun modèle', () => {
    const container = renderApp()
    const query = 'modèle inexistant'

    changeSearch(container, query)

    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(container.querySelector('[role="status"]')?.textContent).toContain(query)
    expect(container.querySelector('[role="region"]')).toBeNull()
    expect(container.textContent).not.toContain("la recommandation n'est pas disponible")
  })
})
