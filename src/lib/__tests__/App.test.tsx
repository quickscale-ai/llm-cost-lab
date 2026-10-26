// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../../App'

afterEach(cleanup)

describe('recherche de modèle dans l’application', () => {
  it('combine la recherche avec le fournisseur sélectionné et permet de l’effacer', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Mistral AI' }))
    const search = screen.getByRole('searchbox', { name: 'Rechercher un modèle' })
    fireEvent.change(search, { target: { value: 'small' } })

    const filteredTable = screen.getByRole('table')
    expect(within(filteredTable).getByText('Mistral Small 4')).toBeTruthy()
    expect(within(filteredTable).queryByText('Mistral Large 3')).toBeNull()
    expect(within(filteredTable).queryByText('Claude Fable 5.1')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }))

    expect(search).toHaveProperty('value', '')
    const tableAfterClear = screen.getByRole('table')
    expect(within(tableAfterClear).getByText('Mistral Large 3')).toBeTruthy()
    expect(within(tableAfterClear).getByText('Mistral Small 4')).toBeTruthy()
    expect(within(tableAfterClear).queryByText('Claude Fable 5.1')).toBeNull()
  })

  it('affiche le message personnalisé quand la recherche ne retourne aucun modèle', () => {
    render(<App />)

    const search = screen.getByRole('searchbox', { name: 'Rechercher un modèle' })
    fireEvent.change(search, { target: { value: 'modèle inexistant' } })

    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('Aucun modèle ne correspond à cette recherche.')).toBeTruthy()
  })
})
