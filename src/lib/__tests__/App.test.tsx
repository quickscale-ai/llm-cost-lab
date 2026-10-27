// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../../App'

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

describe('recherche de modèle dans l’application', () => {
  it('combine la recherche avec le fournisseur sélectionné et permet de l’effacer', () => {
    const container = renderApp()

    act(() => buttonWithText(container, 'Mistral AI').click())
    const search = changeSearch(container, 'small')
    const filteredTable = container.querySelector('table')
    expect(filteredTable?.textContent).toContain('Mistral Small 4')
    expect(filteredTable?.textContent).not.toContain('Mistral Large 3')
    expect(filteredTable?.textContent).not.toContain('Claude Fable 5.1')

    const clearButton = container.querySelector<HTMLButtonElement>('[aria-label="Effacer la recherche"]')
    if (!clearButton) throw new Error('Bouton d’effacement introuvable')
    act(() => clearButton.click())

    expect(search.value).toBe('')
    const tableAfterClear = container.querySelector('table')
    expect(tableAfterClear?.textContent).toContain('Mistral Large 3')
    expect(tableAfterClear?.textContent).toContain('Mistral Small 4')
    expect(tableAfterClear?.textContent).not.toContain('Claude Fable 5.1')
  })

  it('affiche le message personnalisé quand la recherche ne retourne aucun modèle', () => {
    const container = renderApp()

    changeSearch(container, 'modèle inexistant')

    expect(container.querySelector('table')).toBeNull()
    expect(container.textContent).toContain('Aucun modèle ne correspond à cette recherche.')
  })
})
