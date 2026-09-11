import type { Usage } from '../lib/pricing'
import { formatTokens, parseNumericInput } from '../lib/format'

interface Props {
  usage: Usage
  onChange: (usage: Usage) => void
}

/**
 * Volumes de référence proposés en un clic, pour ne pas saisir au clavier.
 * L'échelle part d'un appel riche (10 K) : 1 M correspond déjà à la fenêtre de
 * contexte maximale des plus gros modèles, ce n'est pas un point de départ.
 */
const PRESETS: { label: string; usage: Usage }[] = [
  { label: '10 K / 2 K', usage: { inputTokens: 10_000, outputTokens: 2_000 } },
  { label: '100 K / 20 K', usage: { inputTokens: 100_000, outputTokens: 20_000 } },
  { label: '1 M / 200 K', usage: { inputTokens: 1_000_000, outputTokens: 200_000 } },
  { label: '10 M / 2 M', usage: { inputTokens: 10_000_000, outputTokens: 2_000_000 } },
]

interface FieldProps {
  id: string
  label: string
  hint: string
  value: number
  onChange: (value: number) => void
}

function TokenField({ id, label, hint, value, onChange }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value === 0 ? '' : formatTokens(value)}
        placeholder="0"
        onChange={(event) => onChange(parseNumericInput(event.target.value))}
        className="tabular mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-lg text-slate-900 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
      />
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  )
}

export function VolumeSimulator({ usage, onChange }: Props) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TokenField
          id="input-tokens"
          label="Tokens en entrée"
          hint="Ce que vous envoyez au modèle : prompts, documents, historique."
          value={usage.inputTokens}
          onChange={(inputTokens) => onChange({ ...usage, inputTokens })}
        />
        <TokenField
          id="output-tokens"
          label="Tokens en sortie"
          hint="Ce que le modèle génère : réponses, code, raisonnement."
          value={usage.outputTokens}
          onChange={(outputTokens) => onChange({ ...usage, outputTokens })}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Volumes types
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.usage)}
            className="tabular rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 transition-colors hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
