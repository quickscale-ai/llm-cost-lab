import { describe, expect, it } from 'vitest'
import {
  VOLUME_PRESET_BUTTON_CLASS,
  VOLUME_PRESET_GRID_CLASS,
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
})
