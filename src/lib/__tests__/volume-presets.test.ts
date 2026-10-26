import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  VOLUME_PRESET_BUTTON_CLASS,
  VOLUME_PRESET_GRID_CLASS,
  VolumeSimulator,
} from '../../components/VolumeSimulator'

describe('boutons Volumes types', () => {
  it('utilise deux colonnes sur mobile et quatre à partir du breakpoint sm', () => {
    expect(VOLUME_PRESET_GRID_CLASS).toContain('grid-cols-2')
    expect(VOLUME_PRESET_GRID_CLASS).toContain('gap-3')
    expect(VOLUME_PRESET_GRID_CLASS).toContain('sm:grid-cols-4')
  })

  it('offre une cible tactile d’au moins 44 px avec un espacement confortable', () => {
    expect(VOLUME_PRESET_BUTTON_CLASS).toContain('min-h-11')
    expect(VOLUME_PRESET_BUTTON_CLASS).toContain('px-3')
    expect(VOLUME_PRESET_BUTTON_CLASS).toContain('py-2')
  })

  it('rend les quatre boutons avec la grille et les classes de cible tactile', () => {
    const markup = renderToStaticMarkup(
      createElement(VolumeSimulator, {
        usage: { inputTokens: 0, outputTokens: 0 },
        onChange: () => undefined,
      }),
    )

    expect(markup).toContain(`class="${VOLUME_PRESET_GRID_CLASS}"`)
    expect(markup).toContain(`class="${VOLUME_PRESET_BUTTON_CLASS}"`)
    expect(markup.match(/<button\b/g) ?? []).toHaveLength(4)
    expect(markup).toContain('10 K / 2 K')
    expect(markup).toContain('100 K / 20 K')
    expect(markup).toContain('1 M / 200 K')
    expect(markup).toContain('10 M / 2 M')
  })
})
