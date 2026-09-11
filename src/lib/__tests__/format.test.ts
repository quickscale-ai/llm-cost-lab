import { describe, it, expect } from 'vitest'
import {
  convert,
  formatCurrency,
  formatTokens,
  formatContextWindow,
  formatDate,
  parseNumericInput,
  XOF_PER_EUR,
} from '../format'
import { USD_TO_XOF } from '../../data/models'

/**
 * Intl insère des espaces insécables (U+00A0) et fines insécables (U+202F) en
 * français. On les normalise pour que les assertions restent lisibles.
 */
const normalize = (s: string) => s.replace(/[  ]/g, ' ')

describe('convert', () => {
  it('laisse les dollars inchangés', () => {
    expect(convert(12.5, 'USD')).toBe(12.5)
  })

  it('applique le taux de change vers le franc CFA', () => {
    expect(convert(1, 'XOF')).toBe(USD_TO_XOF)
  })

  it('convertit en euros via la parité fixe 1 EUR = 655,957 FCFA', () => {
    expect(convert(1, 'EUR')).toBeCloseTo(USD_TO_XOF / XOF_PER_EUR, 10)
  })
})

describe('formatCurrency', () => {
  it('affiche les centimes pour les montants courants', () => {
    expect(normalize(formatCurrency(12.5, 'USD'))).toBe('12,50 $US')
  })

  it('garde de la précision sur les très petits montants', () => {
    expect(formatCurrency(0.0004, 'USD')).toContain('0,0004')
  })

  it('affiche toujours au moins deux décimales sous 1000, pour une colonne alignée', () => {
    expect(normalize(formatCurrency(0.6, 'USD'))).toBe('0,60 $US')
    expect(normalize(formatCurrency(0.2, 'USD'))).toBe('0,20 $US')
    expect(normalize(formatCurrency(5, 'USD'))).toBe('5,00 $US')
  })

  it('supprime les centimes sur les gros montants', () => {
    expect(normalize(formatCurrency(12400, 'USD'))).toBe('12 400 $US')
  })

  it('arrondit le franc CFA à l’unité', () => {
    expect(normalize(formatCurrency(10, 'XOF'))).toBe('5 643 F CFA')
  })

  it('affiche un tiret plutôt que NaN', () => {
    expect(formatCurrency(NaN, 'USD')).toBe('—')
    expect(formatCurrency(Infinity, 'XOF')).toBe('—')
  })

  it('affiche le montant en euros avec le symbole € au format français', () => {
    // 655,957 FCFA = 1 EUR exactement (parité fixe)
    const amountUsd = XOF_PER_EUR / USD_TO_XOF
    expect(normalize(formatCurrency(amountUsd, 'EUR'))).toBe('1,00 €')
  })

  it('gère le zéro', () => {
    expect(normalize(formatCurrency(0, 'USD'))).toBe('0 $US')
  })
})

describe('formatTokens', () => {
  it('sépare les milliers', () => {
    expect(normalize(formatTokens(1234567))).toBe('1 234 567')
  })

  it('affiche un tiret pour une valeur non finie', () => {
    expect(formatTokens(NaN)).toBe('—')
  })
})

describe('formatContextWindow', () => {
  it('abrège les millions', () => {
    expect(normalize(formatContextWindow(1_000_000))).toBe('1 M')
    expect(normalize(formatContextWindow(1_048_576))).toBe('1 M')
  })

  it('abrège les milliers', () => {
    expect(normalize(formatContextWindow(200_000))).toBe('200 K')
  })

  it('affiche un tiret quand la fenêtre n’est pas publiée', () => {
    expect(formatContextWindow(null)).toBe('—')
  })
})

describe('formatDate', () => {
  it('passe de l’ISO au format français', () => {
    expect(formatDate('2026-09-09')).toBe('09/09/2026')
  })

  it('laisse une entrée malformée telle quelle', () => {
    expect(formatDate('pas-une-date')).toBe('pas-une-date')
  })
})

describe('parseNumericInput', () => {
  it('lit un entier simple', () => {
    expect(parseNumericInput('1500')).toBe(1500)
  })

  it('accepte la virgule décimale française', () => {
    expect(parseNumericInput('2,5')).toBe(2.5)
  })

  it('ignore les espaces de séparation des milliers', () => {
    expect(parseNumericInput('1 000 000')).toBe(1_000_000)
  })

  it('retourne 0 pour un champ vidé', () => {
    expect(parseNumericInput('')).toBe(0)
  })

  it('retourne 0 pour une saisie non numérique', () => {
    expect(parseNumericInput('abc')).toBe(0)
  })

  it('retourne 0 pour une valeur négative', () => {
    expect(parseNumericInput('-50')).toBe(0)
  })
})
