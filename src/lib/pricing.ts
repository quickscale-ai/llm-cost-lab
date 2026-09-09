/**
 * Calculs de coût.
 *
 * Toutes les fonctions de ce fichier sont pures : mêmes entrées, mêmes sorties,
 * aucun effet de bord, aucune dépendance à React. C'est ce qui les rend
 * testables unitairement — et REVIEW.md exige un test pour chacune d'elles.
 */

import type { Model } from '../data/models'

/** Un volume d'usage brut, en tokens. */
export interface Usage {
  inputTokens: number
  outputTokens: number
}

/** Le coût d'un usage donné pour un modèle donné, en dollars US. */
export interface CostBreakdown {
  model: Model
  inputCost: number
  outputCost: number
  totalCost: number
}

const TOKENS_PER_MILLION = 1_000_000

/**
 * Assainit une valeur numérique venue de l'interface.
 *
 * Les champs de saisie peuvent produire NaN (champ vidé) ou des valeurs
 * négatives (saisie au clavier). Un coût négatif n'a aucun sens et fausserait
 * tout le classement : on ramène à 0.
 */
function sanitize(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}

/** Coût d'un volume de tokens, en dollars, pour un tarif par million donné. */
export function costForTokens(tokens: number, pricePerMTok: number): number {
  return (sanitize(tokens) / TOKENS_PER_MILLION) * sanitize(pricePerMTok)
}

/** Décompose le coût d'un usage brut pour un modèle. */
export function computeCost(model: Model, usage: Usage): CostBreakdown {
  const inputCost = costForTokens(usage.inputTokens, model.inputPerMTok)
  const outputCost = costForTokens(usage.outputTokens, model.outputPerMTok)
  return {
    model,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  }
}

/**
 * Calcule le coût pour chaque modèle et classe du moins cher au plus cher.
 *
 * À coût égal (typiquement quand le volume saisi est nul), l'ordre est stabilisé
 * par le nom du modèle : sans cela l'affichage sauterait d'un rendu à l'autre.
 */
export function rankByCost(models: Model[], usage: Usage): CostBreakdown[] {
  return models
    .map((model) => computeCost(model, usage))
    .sort((a, b) => {
      const delta = a.totalCost - b.totalCost
      if (delta !== 0) return delta
      return a.model.name.localeCompare(b.model.name, 'fr')
    })
}

/**
 * Coût le plus élevé d'une liste de résultats, utilisé comme référence pour
 * dimensionner les barres de coût relatives. Retourne 0 sur une liste vide.
 */
export function maxTotalCost(breakdowns: CostBreakdown[]): number {
  return breakdowns.reduce((max, b) => Math.max(max, b.totalCost), 0)
}
