import { describe, expect, it } from 'vitest'
import type { Model } from '../../data/models'
import { computeCost } from '../pricing'
import { buildSimulationCsv } from '../export'

const model: Model = {
  id: 'test-model',
  name: 'Modèle; « test »',
  provider: 'Anthropic',
  inputPerMTok: 2,
  outputPerMTok: 10,
  contextWindow: 200_000,
  source: 'https://example.test/pricing?q="csv"',
}

describe('buildSimulationCsv', () => {
  it('produit un CSV UTF-8 séparé par des points-virgules', () => {
    const csv = buildSimulationCsv({
      mode: 'volume',
      usage: { inputTokens: 100_000, outputTokens: 20_000 },
      currency: 'USD',
      breakdowns: [computeCost(model, { inputTokens: 100_000, outputTokens: 20_000 })],
    })

    expect(csv.startsWith('\ufeff')).toBe(true)
    expect(csv).toContain('Simulation;Tokens en entrée;Tokens en sortie')
    expect(csv).toContain('"Volume";100000;20000;;')
    expect(csv).toContain('"Modèle; « test »"')
    expect(csv).toContain('"https://example.test/pricing?q=""csv"""')
    expect(csv).toContain(';0,2;0,2;0,4;;')
  })

  it('exporte les paramètres agentiques et le coût par tâche dans la devise choisie', () => {
    const csv = buildSimulationCsv({
      mode: 'agentic',
      usage: { inputTokens: 4_000_000, outputTokens: 750_000 },
      currency: 'XOF',
      tasksCount: 50,
      callsCount: 500,
      breakdowns: [computeCost(model, { inputTokens: 4_000_000, outputTokens: 750_000 })],
    })

    expect(csv).toContain('"Agentique";4000000;750000;50;500;"XOF"')
    // 8 + 7,5 = 15,5 USD, soit 8 746,495 XOF ; 174,9299 XOF par tâche.
    expect(csv).toContain(';8746,495;174,9299;')
  })
})
