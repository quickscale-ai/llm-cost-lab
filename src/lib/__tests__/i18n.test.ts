import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES, translate, translations } from '../i18n'

describe('traductions de l’interface', () => {
  it('expose les ressources française et anglaise', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['fr', 'en'])
    expect(translations.fr.pageTitle).toBe('Comparateur de coût par token')
    expect(translations.en.pageTitle).toBe('Token Cost Comparator')
    expect(translations.fr.pageHeading).toBe('Comparateur LLM')
    expect(translations.en.pageHeading).toBe('Token Cost Comparator')
    expect(translations.fr.tableModel).toBe('Modèle')
    expect(translations.en.tableModel).toBe('Model')
  })

  it('retourne le texte de la langue demandée', () => {
    expect(translate('fr', 'tableTotalCost')).toBe('Coût total')
    expect(translate('en', 'tableTotalCost')).toBe('Total cost')
  })
})
