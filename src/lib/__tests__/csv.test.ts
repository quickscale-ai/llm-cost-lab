import { describe, expect, it } from 'vitest'
import { MODELS } from '../../data/models'
import { buildPricingCsv, escapeCsvCell, toCsv } from '../csv'
import type { CostBreakdown } from '../pricing'

const smallModel = MODELS.find((model) => model.id === 'mistral-small-4')
if (!smallModel) throw new Error('Modèle Mistral Small 4 introuvable')

const smallBreakdown: CostBreakdown = {
  model: smallModel,
  inputCost: 0.0015,
  outputCost: 0.0012,
  totalCost: 0.0027,
}

describe('échappement CSV', () => {
  it('protège les séparateurs, les guillemets et les retours à la ligne', () => {
    expect(
      toCsv([['simple', 'valeur; séparée', 'un "guillemet"', 'première ligne\ndeuxième ligne']]),
    ).toBe('simple;"valeur; séparée";"un ""guillemet""";"première ligne\ndeuxième ligne"')
  })

  it('convertit les valeurs nulles en cellules vides', () => {
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
  })
})

describe('buildPricingCsv', () => {
  it('exporte les en-têtes et les valeurs du tableau dans la devise choisie', () => {
    const csv = buildPricingCsv([smallBreakdown], 'EUR')

    expect(csv.split('\r\n')).toEqual([
      'Modèle;Fournisseur;Prix / M entrée (EUR);Prix / M sortie (EUR);Contexte;Coût total (EUR)',
      expect.stringContaining('Mistral Small 4'),
    ])
    expect(csv).toContain('Mistral AI')
    expect(csv).toContain('€')
    expect(csv).toContain('256 K')
    expect(csv).not.toContain('Coût / tâche')
  })

  it('ajoute le coût par tâche en mode agentic', () => {
    const csv = buildPricingCsv([smallBreakdown], 'USD', 50)

    expect(csv.split('\r\n')[0]).toContain('Coût / tâche (USD)')
    expect(csv.split('\r\n')[1]).toContain('0,00')
  })

  it('ne crée aucune ligne lorsqu’aucun modèle ne correspond', () => {
    const csv = buildPricingCsv([], 'USD')

    expect(csv.split('\r\n')).toEqual([
      'Modèle;Fournisseur;Prix / M entrée (USD);Prix / M sortie (USD);Contexte;Coût total (USD)',
    ])
  })
})
