import { describe, expect, it } from 'vitest'
import type { Model } from '../../data/models'
import { filterModelsByName, normalizeSearchText } from '../search'

const models: Model[] = [
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    inputPerMTok: 1,
    outputPerMTok: 3,
    contextWindow: 128_000,
    source: 'https://example.test/mistral',
  },
  {
    id: 'etoile',
    name: 'Étoile rapide',
    provider: 'Anthropic',
    inputPerMTok: 1,
    outputPerMTok: 3,
    contextWindow: 128_000,
    source: 'https://example.test/etoile',
  },
  {
    id: 'small',
    name: 'Mistral Small',
    provider: 'Mistral AI',
    inputPerMTok: 1,
    outputPerMTok: 3,
    contextWindow: 128_000,
    source: 'https://example.test/small',
  },
]

describe('normalizeSearchText', () => {
  it('ignore la casse et les accents', () => {
    expect(normalizeSearchText('ÉTOILE')).toBe('etoile')
  })
})

describe('filterModelsByName', () => {
  it('filtre par sous-chaîne sans tenir compte de la casse', () => {
    expect(filterModelsByName(models, 'large').map((model) => model.id)).toEqual(['mistral-large'])
  })

  it('filtre les accents dans le nom et dans la recherche', () => {
    expect(filterModelsByName(models, 'etoile').map((model) => model.id)).toEqual(['etoile'])
    expect(filterModelsByName(models, 'ÉTOILE').map((model) => model.id)).toEqual(['etoile'])
  })

  it('combine naturellement avec un filtrage fournisseur précédent', () => {
    const mistralModels = models.filter((model) => model.provider === 'Mistral AI')
    expect(filterModelsByName(mistralModels, 'mistral').map((model) => model.id)).toEqual([
      'mistral-large',
      'small',
    ])
  })

  it('retourne tous les modèles pour une recherche vide et conserve l’ordre', () => {
    expect(filterModelsByName(models, '  ').map((model) => model.id)).toEqual([
      'mistral-large',
      'etoile',
      'small',
    ])
  })

  it('retourne une liste vide sans correspondance', () => {
    expect(filterModelsByName(models, 'inexistant')).toEqual([])
  })
})
