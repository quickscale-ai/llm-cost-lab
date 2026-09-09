import type { Currency } from '../lib/format'

interface Props {
  value: Currency
  onChange: (currency: Currency) => void
}

const OPTIONS: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'XOF', label: 'FCFA' },
]

export function CurrencyToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Devise d’affichage"
      className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
              selected
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
