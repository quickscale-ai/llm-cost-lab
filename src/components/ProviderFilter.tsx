import type { Provider } from '../data/models'

interface Props {
  providers: Provider[]
  selected: Set<Provider>
  onToggle: (provider: Provider) => void
  onReset: () => void
}

export function ProviderFilter({ providers, selected, onToggle, onReset }: Props) {
  const allSelected = selected.size === 0

  return (
    <div>
      <span id="provider-filter-label" className="mb-2 block text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        Fournisseurs
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="provider-filter-label">
        <button
          type="button"
          aria-pressed={allSelected}
          onClick={onReset}
          className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
            allSelected
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Tous
        </button>
        {providers.map((provider) => {
          const active = selected.has(provider)
          return (
            <button
              key={provider}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(provider)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {provider}
            </button>
          )
        })}
      </div>
    </div>
  )
}
