import { describe, expect, it } from 'vitest'
import type { Model } from '../../data/models'
import { filterModelsByContextWindow } from '../context'

const models: Model[] = [
  {
    id: 'unknown',
    name: 'Fenêtre inconnue',
    provider: 'Google',
    inputPerMTok: 1,
    outputPerMTok: 1,
    contextWindow: null,
    source: 'https://example.test/unknown',
  },
  {
    id: 'small',
    name: 'Fenêtre 100K',
    provider: 'Anthropic',
    inputPerMTok: 1,
    outputPerMTok: 1,
    contextWindow: 100_000,
    source: 'https://example.test/small',
  },
  {
    id: 'boundary-128k',
    name: 'Fenêtre 128K',
    provider: 'Anthropic',
    inputPerMTok: 1,
    outputPerMTok: 1,
    contextWindow: 128_000,
    source: 'https://example.test/128k',
  },
  {
    id: 'boundary-256k',
    name: 'Fenêtre 256K',
    provider: 'OpenAI',
    inputPerMTok: 1,
    outputPerMTok: 1,
    contextWindow: 256_000,
    source: 'https://example.test/256k',
  },
  {
    id: 'million',
    name: 'Fenêtre 1M',
    provider: 'DeepSeek',
    inputPerMTok: 1,
    outputPerMTok: 1,
    contextWindow: 1_000_000,
    source: 'https://example.test/million',
  },
]

describe('filterModelsByContextWindow', () => {
  it('conserve tous les modèles sans minimum, y compris les fenêtres inconnues', () => {
    expect(filterModelsByContextWindow(models, 0)).toBe(models)
  })

  it('exclut les fenêtres inconnues et conserve la valeur seuil', () => {
    expect(filterModelsByContextWindow(models, 128_000).map((model) => model.id)).toEqual([
      'boundary-128k',
      'boundary-256k',
      'million',
    ])
  })

  it('applique le seuil de 256 K tokens', () => {
    expect(filterModelsByContextWindow(models, 256_000).map((model) => model.id)).toEqual([
      'boundary-256k',
      'million',
    ])
  })

  it('accepte une fenêtre exactement égale à 1 M tokens', () => {
    expect(filterModelsByContextWindow(models, 1_000_000).map((model) => model.id)).toEqual(['million'])
  })
})
