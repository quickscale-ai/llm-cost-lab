import type { Model } from '../data/models'

export type ContextWindowMinimum = 0 | 128_000 | 256_000 | 1_000_000

/** Seuils proposés dans le filtre de fenêtre de contexte. */
export const CONTEXT_WINDOW_OPTIONS: readonly {
  value: ContextWindowMinimum
  label: string
}[] = [
  { value: 0, label: 'Aucun minimum' },
  { value: 128_000, label: '128 K tokens' },
  { value: 256_000, label: '256 K tokens' },
  { value: 1_000_000, label: '1 M tokens' },
]

/**
 * Conserve les modèles dont la fenêtre publiée atteint le seuil demandé.
 * Une fenêtre inconnue ne peut satisfaire qu'un filtre sans minimum.
 */
export function filterModelsByContextWindow(models: Model[], minimum: ContextWindowMinimum): Model[] {
  if (minimum === 0) return models
  return models.filter((model) => model.contextWindow !== null && model.contextWindow >= minimum)
}
