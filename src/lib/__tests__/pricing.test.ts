import { describe, it, expect } from 'vitest'
import {
  costForTokens,
  computeCost,
  rankByCost,
  maxTotalCost,
  computeSavings,
  totalCalls,
  agenticToUsage,
  costPerTask,
} from '../pricing'
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

describe('computeSavings', () => {
  it('retourne la différence entre le plus cher et le moins cher', () => {
    const ranked = rankByCost([opus, haiku], { inputTokens: 1_000_000, outputTokens: 1_000_000 })
    // haiku : 1+5 = 6 $, opus : 5+25 = 30 $ → économie = 24 $
    expect(computeSavings(ranked)).toBe(24)
  })

  it('retourne 0 sur une liste vide', () => {
    expect(computeSavings([])).toBe(0)
  })

  it('retourne 0 sur une liste à un seul modèle', () => {
    const ranked = rankByCost([haiku], { inputTokens: 1_000_000, outputTokens: 1_000_000 })
    expect(computeSavings(ranked)).toBe(0)
  })

  it('retourne 0 quand tous les coûts sont nuls (volume zéro)', () => {
    const ranked = rankByCost([opus, haiku], { inputTokens: 0, outputTokens: 0 })
    expect(computeSavings(ranked)).toBe(0)
  })
})

describe('totalCalls', () => {
  it('multiplie les tâches par les itérations', () => {
    expect(totalCalls({ tasks: 50, iterationsPerTask: 10, inputTokensPerCall: 0, outputTokensPerCall: 0 })).toBe(500)
  })

  it("retourne 0 si l'un des facteurs est nul", () => {
    expect(totalCalls({ tasks: 0, iterationsPerTask: 10, inputTokensPerCall: 0, outputTokensPerCall: 0 })).toBe(0)
    expect(totalCalls({ tasks: 50, iterationsPerTask: 0, inputTokensPerCall: 0, outputTokensPerCall: 0 })).toBe(0)
  })

  it('ramène les entrées négatives à 0', () => {
    expect(totalCalls({ tasks: -5, iterationsPerTask: 10, inputTokensPerCall: 0, outputTokensPerCall: 0 })).toBe(0)
  })
})

describe('agenticToUsage', () => {
  it('calcule le volume total de tokens', () => {
    const usage = agenticToUsage({
      tasks: 50,
      iterationsPerTask: 10,
      inputTokensPerCall: 8_000,
      outputTokensPerCall: 1_500,
    })
    // 50 × 10 = 500 appels → 500 × 8 000 = 4 000 000 entrée, 500 × 1 500 = 750 000 sortie
    expect(usage.inputTokens).toBe(4_000_000)
    expect(usage.outputTokens).toBe(750_000)
  })

  it('retourne un usage nul si les tâches sont à 0', () => {
    const usage = agenticToUsage({
      tasks: 0,
      iterationsPerTask: 10,
      inputTokensPerCall: 8_000,
      outputTokensPerCall: 1_500,
    })
    expect(usage.inputTokens).toBe(0)
    expect(usage.outputTokens).toBe(0)
  })
})

describe('costPerTask', () => {
  it('divise le coût total par le nombre de tâches', () => {
    expect(costPerTask(100, 50)).toBe(2)
  })

  it('retourne 0 si le nombre de tâches est nul', () => {
    expect(costPerTask(100, 0)).toBe(0)
  })

  it('retourne 0 si le nombre de tâches est négatif', () => {
    expect(costPerTask(100, -10)).toBe(0)
  })
})
