import type { Model } from '../data/models'

/**
 * Rend un texte comparable pour une recherche tolérante à la casse et aux accents.
 */
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Conserve les modèles dont le nom contient la recherche.
 *
 * Une recherche vide, y compris après suppression des espaces superflus,
 * n'applique aucun filtre. L'ordre de la liste reçue est conservé.
 */
export function filterModelsByName(models: Model[], query: string): Model[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  if (normalizedQuery === '') return models

  return models.filter((model) => normalizeSearchText(model.name).includes(normalizedQuery))
}
