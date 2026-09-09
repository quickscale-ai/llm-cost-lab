/**
 * Tarifs publics des modèles de langage, en dollars US par million de tokens.
 *
 * Chaque ligne porte l'URL de la page tarifaire officielle dont elle est issue.
 * Ces chiffres sont saisis à la main et datés : ils ne sont pas récupérés en
 * temps réel. Vérifiez `PRICING_VERIFIED_AT` avant de vous en servir pour une
 * décision d'achat.
 */

export type Provider =
  | 'Anthropic'
  | 'OpenAI'
  | 'Google'
  | 'xAI'
  | 'Mistral AI'
  | 'DeepSeek'
  | 'Meta'

export interface Model {
  /** Identifiant stable, utilisé comme clé React et dans les URL. */
  id: string
  name: string
  provider: Provider
  /** Dollars US par million de tokens en entrée. */
  inputPerMTok: number
  /** Dollars US par million de tokens en sortie. */
  outputPerMTok: number
  /** Fenêtre de contexte en tokens. `null` si le fournisseur ne la publie pas. */
  contextWindow: number | null
  /**
   * Précision affichée en infobulle quand le tarif retenu n'est qu'un palier
   * parmi d'autres (contexte long, heures pleines, cache…).
   */
  tierNote?: string
  /** Page tarifaire officielle d'où viennent les deux prix ci-dessus. */
  source: string
}

/** Date de la dernière vérification manuelle de tous les tarifs (ISO 8601). */
export const PRICING_VERIFIED_AT = '2026-09-09'

/**
 * 1 USD en francs CFA (XOF). Le franc CFA est arrimé à l'euro à 655,957
 * XOF/EUR, donc ce taux ne bouge qu'avec la parité EUR/USD.
 * Relevé le 09/09/2026. Constante volontaire : l'application ne fait aucun
 * appel réseau à l'exécution, pour rester utilisable sur un réseau dégradé.
 */
export const USD_TO_XOF = 564.29
export const FX_RATE_DATE = '2026-09-09'

const ANTHROPIC = 'https://docs.claude.com/en/docs/about-claude/pricing'
const OPENAI = 'https://developers.openai.com/api/docs/pricing'
const GOOGLE = 'https://ai.google.dev/gemini-api/docs/pricing'
const XAI = 'https://docs.x.ai/docs/models'
const MISTRAL = 'https://mistral.ai/pricing/api'
const DEEPSEEK = 'https://api-docs.deepseek.com/quick_start/pricing'
const TOGETHER = 'https://www.together.ai/models/llama-4-maverick'

export const MODELS: Model[] = [
  {
    id: 'claude-fable-5-1',
    name: 'Claude Fable 5.1',
    provider: 'Anthropic',
    inputPerMTok: 10,
    outputPerMTok: 50,
    contextWindow: 1_000_000,
    source: ANTHROPIC,
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    provider: 'Anthropic',
    inputPerMTok: 5,
    outputPerMTok: 25,
    contextWindow: 1_000_000,
    source: ANTHROPIC,
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'Anthropic',
    inputPerMTok: 2,
    outputPerMTok: 10,
    contextWindow: 1_000_000,
    source: ANTHROPIC,
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    inputPerMTok: 1,
    outputPerMTok: 5,
    contextWindow: 200_000,
    source: ANTHROPIC,
  },
  {
    id: 'gpt-6-astra',
    name: 'GPT-6 Astra',
    provider: 'OpenAI',
    inputPerMTok: 10,
    outputPerMTok: 50,
    contextWindow: 1_050_000,
    tierNote: 'Tarif jusqu’à 272K tokens de contexte. Au-delà : 20 $ / 75 $.',
    source: OPENAI,
  },
  {
    id: 'gpt-5-6-terra',
    name: 'GPT-5.6 Terra',
    provider: 'OpenAI',
    inputPerMTok: 2,
    outputPerMTok: 12,
    contextWindow: null,
    tierNote: 'Tarif jusqu’à 272K tokens de contexte. Au-delà : 4 $ / 18 $.',
    source: OPENAI,
  },
  {
    id: 'gpt-5-6-luna',
    name: 'GPT-5.6 Luna',
    provider: 'OpenAI',
    inputPerMTok: 0.2,
    outputPerMTok: 1.2,
    contextWindow: 1_050_000,
    tierNote: 'Tarif jusqu’à 272K tokens de contexte. Au-delà : 0,40 $ / 1,80 $.',
    source: OPENAI,
  },
  {
    id: 'gemini-3-1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    inputPerMTok: 2,
    outputPerMTok: 12,
    contextWindow: null,
    tierNote: 'Tarif jusqu’à 200K tokens de contexte. Au-delà : 4 $ / 18 $.',
    source: GOOGLE,
  },
  {
    id: 'gemini-3-5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'Google',
    inputPerMTok: 1.5,
    outputPerMTok: 9,
    contextWindow: null,
    source: GOOGLE,
  },
  {
    id: 'gemini-3-5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    provider: 'Google',
    inputPerMTok: 0.3,
    outputPerMTok: 2.5,
    contextWindow: null,
    source: GOOGLE,
  },
  {
    id: 'grok-4-6',
    name: 'Grok 4.6',
    provider: 'xAI',
    inputPerMTok: 2,
    outputPerMTok: 6,
    contextWindow: 500_000,
    tierNote: 'Tarif en dessous de 200K tokens de contexte. Au-delà : 4 $ / 12 $.',
    source: XAI,
  },
  {
    id: 'mistral-large-3',
    name: 'Mistral Large 3',
    provider: 'Mistral AI',
    inputPerMTok: 0.5,
    outputPerMTok: 1.5,
    contextWindow: 262_144,
    tierNote: 'Fenêtre de contexte issue de la fiche modèle, pas de la page tarifaire.',
    source: MISTRAL,
  },
  {
    id: 'mistral-small-4',
    name: 'Mistral Small 4',
    provider: 'Mistral AI',
    inputPerMTok: 0.15,
    outputPerMTok: 0.6,
    contextWindow: 256_000,
    tierNote: 'Fenêtre de contexte issue de la fiche modèle, pas de la page tarifaire.',
    source: MISTRAL,
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'DeepSeek',
    inputPerMTok: 0.66,
    outputPerMTok: 1.98,
    contextWindow: 1_000_000,
    tierNote: 'Tarif heures creuses, hors cache. En heures pleines : 1,32 $ / 3,96 $.',
    source: DEEPSEEK,
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'DeepSeek',
    inputPerMTok: 0.22,
    outputPerMTok: 0.66,
    contextWindow: 1_000_000,
    tierNote: 'Tarif heures creuses, hors cache. En heures pleines : 0,44 $ / 1,32 $.',
    source: DEEPSEEK,
  },
  {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    inputPerMTok: 0.27,
    outputPerMTok: 0.85,
    contextWindow: 1_048_576,
    tierNote: 'Modèle ouvert : tarif de l’hébergeur Together AI, pas de Meta.',
    source: TOGETHER,
  },
]

export const PROVIDERS: Provider[] = [
  ...new Set(MODELS.map((m) => m.provider)),
]
