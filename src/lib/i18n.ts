export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export type TranslationKey =
  | 'pageTitle'
  | 'pageHeading'
  | 'tableModel'
  | 'tableInput'
  | 'tableOutput'
  | 'tableContext'
  | 'tableTotalCost'
  | 'tableCostPerTask'
  | 'mobileInput'
  | 'mobileOutput'
  | 'mobileContext'
  | 'mobileCostPerTask'

export const translations: Record<Language, Record<TranslationKey, string>> = {
  fr: {
    pageTitle: 'Comparateur de coût par token',
    pageHeading: 'Comparateur LLM',
    tableModel: 'Modèle',
    tableInput: '$ / M entrée',
    tableOutput: '$ / M sortie',
    tableContext: 'Contexte',
    tableTotalCost: 'Coût total',
    tableCostPerTask: 'Coût / tâche',
    mobileInput: 'Entrée',
    mobileOutput: 'Sortie',
    mobileContext: 'Contexte',
    mobileCostPerTask: '/ tâche',
  },
  en: {
    pageTitle: 'Token Cost Comparator',
    pageHeading: 'Token Cost Comparator',
    tableModel: 'Model',
    tableInput: '$ / M input',
    tableOutput: '$ / M output',
    tableContext: 'Context',
    tableTotalCost: 'Total cost',
    tableCostPerTask: 'Cost / task',
    mobileInput: 'Input',
    mobileOutput: 'Output',
    mobileContext: 'Context',
    mobileCostPerTask: '/ task',
  },
}

export function translate(language: Language, key: TranslationKey): string {
  return translations[language][key]
}
