import { describe, expect, it } from 'vitest'
import { decodeSimulation, encodeSimulation } from '../share'

const baseUrl = 'https://example.test/simulate'

describe('encodeSimulation', () => {
  it('encode une simulation volume dans une URL partageable', () => {
    const link = encodeSimulation(
      {
        mode: 'volume',
        usage: { inputTokens: 250_000, outputTokens: 75_000 },
        agenticParams: {
          tasks: 1,
          iterationsPerTask: 1,
          inputTokensPerCall: 1,
          outputTokensPerCall: 1,
        },
        currency: 'XOF',
        selectedProviders: ['OpenAI', 'Mistral AI'],
      },
      baseUrl,
    )

    const url = new URL(link)
    expect(url.origin + url.pathname).toBe(baseUrl)
    expect(url.searchParams.get('mode')).toBe('volume')
    expect(url.searchParams.get('input')).toBe('250000')
    expect(url.searchParams.get('output')).toBe('75000')
    expect(url.searchParams.get('currency')).toBe('XOF')
    expect(url.searchParams.get('providers')).toBe('OpenAI,Mistral AI')
  })
})

describe('decodeSimulation', () => {
  it('reconstitue une simulation volume complète', () => {
    expect(
      decodeSimulation(
        '?mode=volume&input=250000&output=75000&currency=XOF&providers=OpenAI%2CMistral%20AI',
      ),
    ).toEqual({
      mode: 'volume',
      usage: { inputTokens: 250_000, outputTokens: 75_000 },
      agenticParams: {
        tasks: 50,
        iterationsPerTask: 10,
        inputTokensPerCall: 8_000,
        outputTokensPerCall: 1_500,
      },
      currency: 'XOF',
      selectedProviders: ['OpenAI', 'Mistral AI'],
    })
  })

  it('reconstitue les quatre volumes d’une estimation agentic', () => {
    expect(
      decodeSimulation(
        '?mode=agentic&tasks=12&iterations=6&inputPerCall=8000&outputPerCall=1500&currency=EUR&providers=Anthropic',
      ),
    ).toEqual({
      mode: 'agentic',
      usage: { inputTokens: 100_000, outputTokens: 20_000 },
      agenticParams: {
        tasks: 12,
        iterationsPerTask: 6,
        inputTokensPerCall: 8_000,
        outputTokensPerCall: 1_500,
      },
      currency: 'EUR',
      selectedProviders: ['Anthropic'],
    })
  })

  it('refuse une URL incomplète ou une devise inconnue', () => {
    expect(decodeSimulation('?mode=volume&input=1&currency=USD')).toBeNull()
    expect(
      decodeSimulation('?mode=volume&input=1&output=1&currency=GBP'),
    ).toBeNull()
  })
})
