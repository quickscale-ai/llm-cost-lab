import type { ContextWindowMinimum } from '../lib/context'
import { CONTEXT_WINDOW_OPTIONS } from '../lib/context'

interface Props {
  value: ContextWindowMinimum
  onChange: (value: ContextWindowMinimum) => void
}

export function ContextFilter({ value, onChange }: Props) {
  return (
    <div>
      <label
        htmlFor="context-window-minimum"
        className="block text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400"
      >
        Fenêtre de contexte minimale
      </label>
      <select
        id="context-window-minimum"
        name="context-window-minimum"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as ContextWindowMinimum)}
        className="mt-2 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
      >
        {CONTEXT_WINDOW_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
