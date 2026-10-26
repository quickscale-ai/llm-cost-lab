import type { Provider } from '../data/models'
import type { AgenticParams, Usage } from './pricing'
import type { Currency } from './format'

export interface ShareState {
  mode: 'volume' | 'agentic'
  usage: Usage
  agenticParams: AgenticParams
  currency: Currency
  selectedProviders: readonly Provider[]
  comparisonSelection: readonly [string, string]
}

const SHARE_KEYS = [
  'mode',
  'currency',
  'inputTokens',
  'outputTokens',
  'tasks',
  'iterationsPerTask',
  'inputTokensPerCall',
  'outputTokensPerCall',
  'providers',
  'firstModel',
  'secondModel',
]

/** Crée un lien autonome qui conserve tous les réglages du simulateur. */
export function createShareUrl(state: ShareState, currentUrl: string): string {
  const url = new URL(currentUrl)
  const params = url.searchParams

  SHARE_KEYS.forEach((key) => params.delete(key))
  params.set('mode', state.mode)
  params.set('currency', state.currency)
  params.set('inputTokens', String(state.usage.inputTokens))
  params.set('outputTokens', String(state.usage.outputTokens))
  params.set('tasks', String(state.agenticParams.tasks))
  params.set('iterationsPerTask', String(state.agenticParams.iterationsPerTask))
  params.set('inputTokensPerCall', String(state.agenticParams.inputTokensPerCall))
  params.set('outputTokensPerCall', String(state.agenticParams.outputTokensPerCall))
  params.set('providers', state.selectedProviders.join('|'))
  params.set('firstModel', state.comparisonSelection[0])
  params.set('secondModel', state.comparisonSelection[1])
  url.hash = ''

  return url.toString()
}

/** Lit un lien partagé en ignorant les valeurs inconnues ou invalides. */
export function readShareState(
  search: string,
  defaults: ShareState,
  validProviders: readonly Provider[],
  validModelIds: readonly string[],
): ShareState {
  const params = new URLSearchParams(search)
  const defaultFirst = validModelIds.includes(defaults.comparisonSelection[0])
    ? defaults.comparisonSelection[0]
    : (validModelIds[0] ?? '')
  const defaultSecond = validModelIds.includes(defaults.comparisonSelection[1]) && defaults.comparisonSelection[1] !== defaultFirst
    ? defaults.comparisonSelection[1]
    : (validModelIds.find((id) => id !== defaultFirst) ?? '')

  const firstModel = readModelId(params.get('firstModel'), defaultFirst, validModelIds)
  const secondModelCandidate = readModelId(params.get('secondModel'), defaultSecond, validModelIds)
  const secondModel = secondModelCandidate === firstModel
    ? (validModelIds.find((id) => id !== firstModel) ?? secondModelCandidate)
    : secondModelCandidate

  const providersParam = params.get('providers')
  const selectedProviders = providersParam === null
    ? [...defaults.selectedProviders]
    : validProviders.filter((provider) => providersParam.split('|').includes(provider))

  return {
    mode: params.get('mode') === 'agentic' ? 'agentic' : params.get('mode') === 'volume' ? 'volume' : defaults.mode,
    usage: {
      inputTokens: readNonNegativeNumber(params.get('inputTokens'), defaults.usage.inputTokens),
      outputTokens: readNonNegativeNumber(params.get('outputTokens'), defaults.usage.outputTokens),
    },
    agenticParams: {
      tasks: readNonNegativeNumber(params.get('tasks'), defaults.agenticParams.tasks),
      iterationsPerTask: readNonNegativeNumber(
        params.get('iterationsPerTask'),
        defaults.agenticParams.iterationsPerTask,
      ),
      inputTokensPerCall: readNonNegativeNumber(
        params.get('inputTokensPerCall'),
        defaults.agenticParams.inputTokensPerCall,
      ),
      outputTokensPerCall: readNonNegativeNumber(
        params.get('outputTokensPerCall'),
        defaults.agenticParams.outputTokensPerCall,
      ),
    },
    currency: readCurrency(params.get('currency'), defaults.currency),
    selectedProviders,
    comparisonSelection: [firstModel, secondModel],
  }
}

function readNonNegativeNumber(raw: string | null, fallback: number): number {
  if (raw === null || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function readCurrency(raw: string | null, fallback: Currency): Currency {
  return raw === 'USD' || raw === 'XOF' || raw === 'EUR' ? raw : fallback
}

function readModelId(raw: string | null, fallback: string, validModelIds: readonly string[]): string {
  return raw !== null && validModelIds.includes(raw) ? raw : fallback
}
