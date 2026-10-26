import { PROVIDERS } from '../data/models'
import type { Provider } from '../data/models'
import type { AgenticParams, Usage } from './pricing'
import type { Currency } from './format'

export type SimMode = 'volume' | 'agentic'

export interface SharedSimulation {
  mode: SimMode
  usage: Usage
  agenticParams: AgenticParams
  currency: Currency
  selectedProviders: Provider[]
}

const CURRENCIES: readonly Currency[] = ['USD', 'XOF', 'EUR']

function isCurrency(value: string | null): value is Currency {
  return CURRENCIES.includes(value as Currency)
}

function parseNonNegativeNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : null
}

function parseProviders(raw: string | null): Provider[] {
  if (!raw) return []

  return raw.split(',').filter((provider): provider is Provider =>
    PROVIDERS.includes(provider as Provider),
  )
}

/** Lit une simulation encodée dans la query string, ou retourne null si elle est invalide. */
export function decodeSimulation(search: string): SharedSimulation | null {
  const params = new URLSearchParams(search)
  const mode = params.get('mode')
  if (mode !== 'volume' && mode !== 'agentic') return null

  const currency = params.get('currency')
  if (!isCurrency(currency)) return null

  const input = parseNonNegativeNumber(params.get(mode === 'volume' ? 'input' : 'inputPerCall'))
  const output = parseNonNegativeNumber(params.get(mode === 'volume' ? 'output' : 'outputPerCall'))
  if (input === null || output === null) return null

  if (mode === 'volume') {
    return {
      mode,
      usage: { inputTokens: input, outputTokens: output },
      agenticParams: {
        tasks: 50,
        iterationsPerTask: 10,
        inputTokensPerCall: 8_000,
        outputTokensPerCall: 1_500,
      },
      currency,
      selectedProviders: parseProviders(params.get('providers')),
    }
  }

  const tasks = parseNonNegativeNumber(params.get('tasks'))
  const iterationsPerTask = parseNonNegativeNumber(params.get('iterations'))
  if (tasks === null || iterationsPerTask === null) return null

  return {
    mode,
    usage: { inputTokens: 100_000, outputTokens: 20_000 },
    agenticParams: {
      tasks,
      iterationsPerTask,
      inputTokensPerCall: input,
      outputTokensPerCall: output,
    },
    currency,
    selectedProviders: parseProviders(params.get('providers')),
  }
}

/** Construit une adresse autonome contenant tous les paramètres d'une simulation. */
export function encodeSimulation(simulation: SharedSimulation, baseUrl?: string): string {
  const url = new URL(
    baseUrl ?? (typeof window === 'undefined' ? 'http://localhost/' : window.location.href),
  )
  const params = new URLSearchParams()

  params.set('mode', simulation.mode)
  params.set('currency', simulation.currency)
  params.set('providers', simulation.selectedProviders.join(','))

  if (simulation.mode === 'volume') {
    params.set('input', String(simulation.usage.inputTokens))
    params.set('output', String(simulation.usage.outputTokens))
  } else {
    params.set('tasks', String(simulation.agenticParams.tasks))
    params.set('iterations', String(simulation.agenticParams.iterationsPerTask))
    params.set('inputPerCall', String(simulation.agenticParams.inputTokensPerCall))
    params.set('outputPerCall', String(simulation.agenticParams.outputTokensPerCall))
  }

  url.search = params.toString()
  url.hash = ''
  return url.toString()
}
