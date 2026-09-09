import { describe, it, expect } from 'vitest'
import { costForTokens, computeCost, rankByCost, maxTotalCost } from '../pricing'
import type { Model } from '../../data/models'

const opus: Model = {
  id: 'test-opus',
  name: 'Test Opus',
  provider: 'Anthropic',
  inputPerMTok: 5,
  outputPerMTok: 25,
  contextWindow: 1_000_000,
  source: 'https://example.test',
}

const haiku: Model = {
  ...opus,
  id: 'test-haiku',
  name: 'Test Haiku',
  inputPerMTok: 1,
  outputPerMTok: 5,
}

describe('costForTokens', () => {
  it('facture au prorata du million de tokens', () => {
    expect(costForTokens(1_000_000, 5)).toBe(5)
    expect(costForTokens(500_000, 5)).toBe(2.5)
    expect(costForTokens(1_000, 5)).toBeCloseTo(0.005, 10)
  })

  it('retourne 0 pour un volume nul', () => {
    expect(costForTokens(0, 25)).toBe(0)
  })

  it('ramène les entrées négatives ou non finies à 0', () => {
    expect(costForTokens(-1000, 5)).toBe(0)
    expect(costForTokens(NaN, 5)).toBe(0)
    expect(costForTokens(Infinity, 5)).toBe(0)
    expect(costForTokens(1_000_000, -5)).toBe(0)
  })
})

describe('computeCost', () => {
  it('sépare le coût d’entrée et celui de sortie', () => {
    const result = computeCost(opus, { inputTokens: 2_000_000, outputTokens: 1_000_000 })
    expect(result.inputCost).toBe(10)
    expect(result.outputCost).toBe(25)
    expect(result.totalCost).toBe(35)
  })

  it('renvoie un coût nul quand aucun token n’est consommé', () => {
    const result = computeCost(opus, { inputTokens: 0, outputTokens: 0 })
    expect(result.totalCost).toBe(0)
  })

  it('conserve une référence au modèle pour l’affichage', () => {
    expect(computeCost(opus, { inputTokens: 0, outputTokens: 0 }).model).toBe(opus)
  })
})

describe('rankByCost', () => {
  it('classe du moins cher au plus cher', () => {
    const ranked = rankByCost([opus, haiku], { inputTokens: 1_000_000, outputTokens: 1_000_000 })
    expect(ranked.map((r) => r.model.id)).toEqual(['test-haiku', 'test-opus'])
  })

  it('départage les ex æquo par nom, pour un ordre stable', () => {
    const ranked = rankByCost([opus, haiku], { inputTokens: 0, outputTokens: 0 })
    expect(ranked.map((r) => r.model.name)).toEqual(['Test Haiku', 'Test Opus'])
  })

  it('ne modifie pas le tableau reçu', () => {
    const models = [opus, haiku]
    rankByCost(models, { inputTokens: 1_000_000, outputTokens: 0 })
    expect(models.map((m) => m.id)).toEqual(['test-opus', 'test-haiku'])
  })

  it('accepte une liste vide', () => {
    expect(rankByCost([], { inputTokens: 100, outputTokens: 100 })).toEqual([])
  })
})

describe('maxTotalCost', () => {
  it('retourne le coût le plus élevé', () => {
    const ranked = rankByCost([opus, haiku], { inputTokens: 1_000_000, outputTokens: 1_000_000 })
    expect(maxTotalCost(ranked)).toBe(30)
  })

  it('retourne 0 sur une liste vide', () => {
    expect(maxTotalCost([])).toBe(0)
  })
})
