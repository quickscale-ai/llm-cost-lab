import { describe, expect, it } from 'vitest'
import type { Provider } from '../../data/models'
import type { Currency } from '../format'
import type { ShareState } from '../share'
import { createShareUrl, readShareState } from '../share'

const providers: Provider[] = ['Anthropic', 'OpenAI', 'Google']
const modelIds = ['model-one', 'model-two', 'model-three']
const defaults: ShareState = {
  mode: 'volume',
  usage: { inputTokens: 100, outputTokens: 20 },
  agenticParams: {
    tasks: 5,
    iterationsPerTask: 2,
    inputTokensPerCall: 80,
    outputTokensPerCall: 15,
  },
  currency: 'USD' as Currency,
  selectedProviders: [],
  comparisonSelection: ['model-one', 'model-two'],
}

const sharedState: ShareState = {
  mode: 'agentic',
  usage: { inputTokens: 12_345, outputTokens: 678 },
  agenticParams: {
    tasks: 40,
    iterationsPerTask: 7,
    inputTokensPerCall: 2_500,
    outputTokensPerCall: 450,
  },
  currency: 'EUR',
  selectedProviders: ['Anthropic', 'OpenAI'],
  comparisonSelection: ['model-three', 'model-one'],
}

describe('createShareUrl', () => {
  it('encode tous les réglages dans un lien partageable', () => {
    const url = createShareUrl(sharedState, 'https://example.test/simulateur?old=value#section')

    expect(url).toContain('mode=agentic')
    expect(url).toContain('currency=EUR')
    expect(url).toContain('providers=Anthropic%7COpenAI')
    expect(url).toContain('old=value')
    expect(url).not.toContain('#section')
    expect(readShareState(new URL(url).search, defaults, providers, modelIds)).toEqual(sharedState)
  })

  it('conserve une sélection vide de fournisseurs', () => {
    const url = createShareUrl(defaults, 'https://example.test/simulateur')

    expect(new URL(url).searchParams.get('providers')).toBe('')
    expect(readShareState(new URL(url).search, sharedState, providers, modelIds).selectedProviders).toEqual([])
  })
})

describe('readShareState', () => {
  it('ignore les valeurs inconnues ou négatives', () => {
    const state = readShareState(
      '?mode=unknown&currency=GBP&inputTokens=-4&tasks=not-a-number&providers=Unknown&firstModel=missing',
      defaults,
      providers,
      modelIds,
    )

    expect(state.mode).toBe('volume')
    expect(state.currency).toBe('USD')
    expect(state.usage.inputTokens).toBe(100)
    expect(state.agenticParams.tasks).toBe(5)
    expect(state.selectedProviders).toEqual([])
    expect(state.comparisonSelection).toEqual(['model-one', 'model-two'])
  })

  it('empêche de comparer le même modèle deux fois', () => {
    const state = readShareState('?firstModel=model-two&secondModel=model-two', defaults, providers, modelIds)

    expect(state.comparisonSelection).toEqual(['model-two', 'model-one'])
  })
})
