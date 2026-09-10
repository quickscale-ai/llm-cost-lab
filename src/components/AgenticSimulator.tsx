import type { AgenticParams } from '../lib/pricing'
import { totalCalls } from '../lib/pricing'
import { formatTokens, parseNumericInput } from '../lib/format'

interface Props {
  params: AgenticParams
  onChange: (params: AgenticParams) => void
}

interface FieldProps {
  id: string
  label: string
  hint: string
  value: number
  onChange: (value: number) => void
}

function NumericField({ id, label, hint, value, onChange }: FieldProps) {
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

export function AgenticSimulator({ params, onChange }: Props) {
  const calls = totalCalls(params)

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumericField
          id="agentic-tasks"
          label="Nombre de tâches"
          hint="Nombre de tâches complètes exécutées sur la période."
          value={params.tasks}
          onChange={(tasks) => onChange({ ...params, tasks })}
        />
        <NumericField
          id="agentic-iterations"
          label="Itérations (appels) par tâche"
          hint="Nombre d'appels au modèle pour accomplir une tâche."
          value={params.iterationsPerTask}
          onChange={(iterationsPerTask) => onChange({ ...params, iterationsPerTask })}
        />
        <NumericField
          id="agentic-input"
          label="Tokens en entrée par appel"
          hint="Prompt système + historique + contexte envoyés à chaque appel."
          value={params.inputTokensPerCall}
          onChange={(inputTokensPerCall) => onChange({ ...params, inputTokensPerCall })}
        />
        <NumericField
          id="agentic-output"
          label="Tokens en sortie par appel"
          hint="Réponse générée par le modèle à chaque appel."
          value={params.outputTokensPerCall}
          onChange={(outputTokensPerCall) => onChange({ ...params, outputTokensPerCall })}
        />
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Soit{' '}
        <span className="tabular font-medium text-slate-700 dark:text-slate-300">
          {formatTokens(params.tasks)} tâche{params.tasks > 1 ? 's' : ''} ×{' '}
          {formatTokens(params.iterationsPerTask)} appel{params.iterationsPerTask > 1 ? 's' : ''}
        </span>{' '}
        ={' '}
        <span className="tabular font-semibold text-slate-900 dark:text-slate-100">
          {formatTokens(calls)} appel{calls > 1 ? 's' : ''} au total
        </span>
      </p>
    </div>
  )
}
