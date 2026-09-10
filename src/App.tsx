import { useMemo, useState } from 'react'
import type { Provider } from './data/models'
import { MODELS, PROVIDERS, PRICING_VERIFIED_AT, FX_RATE_DATE, USD_TO_XOF } from './data/models'
import type { Usage } from './lib/pricing'
import { rankByCost } from './lib/pricing'
import type { Currency } from './lib/format'
import { formatDate, formatTokens } from './lib/format'
import { CurrencyToggle } from './components/CurrencyToggle'
import { ProviderFilter } from './components/ProviderFilter'
import { VolumeSimulator } from './components/VolumeSimulator'
import { PricingTable } from './components/PricingTable'
import { BestValueCard } from './components/BestValueCard'

const DEFAULT_USAGE: Usage = { inputTokens: 1_000_000, outputTokens: 200_000 }

export default function App() {
  const [usage, setUsage] = useState<Usage>(DEFAULT_USAGE)
  const [currency, setCurrency] = useState<Currency>('USD')
  // Un ensemble vide signifie « aucun filtre » : tous les fournisseurs sont affichés.
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(new Set())

  const visibleModels = useMemo(() => {
    if (selectedProviders.size === 0) return MODELS
    return MODELS.filter((model) => selectedProviders.has(model.provider))
  }, [selectedProviders])

  const breakdowns = useMemo(() => rankByCost(visibleModels, usage), [visibleModels, usage])

  function toggleProvider(provider: Provider) {
    setSelectedProviders((previous) => {
      const next = new Set(previous)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })
  }

  const totalTokens = usage.inputTokens + usage.outputTokens

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <header>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-600 uppercase dark:text-brand-500">
            Quickscale AI
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
            Comparateur de coût par token
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Comparez le tarif des principaux modèles de langage et estimez ce que coûterait
            réellement votre usage. Tarifs publics, saisis à la main et datés.
          </p>
        </header>

        <section
          aria-labelledby="simulator-heading"
          className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="simulator-heading" className="text-base font-semibold">
                Simulateur de volume
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Soit{' '}
                <span className="tabular font-medium text-slate-700 dark:text-slate-300">
                  {formatTokens(totalTokens)}
                </span>{' '}
                tokens au total.
              </p>
            </div>
            <CurrencyToggle value={currency} onChange={setCurrency} />
          </div>

          <div className="mt-5">
            <VolumeSimulator usage={usage} onChange={setUsage} />
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <ProviderFilter
              providers={PROVIDERS}
              selected={selectedProviders}
              onToggle={toggleProvider}
              onReset={() => setSelectedProviders(new Set())}
            />
          </div>
        </section>

        <section aria-labelledby="results-heading" className="mt-8">
          <h2 id="results-heading" className="text-base font-semibold">
            Coût estimé, du moins cher au plus cher
          </h2>
          <div className="mt-3">
            <BestValueCard breakdowns={breakdowns} currency={currency} />
          </div>
          <div className="mt-4">
            <PricingTable breakdowns={breakdowns} currency={currency} />
          </div>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>
            Tarifs publics vérifiés le{' '}
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {formatDate(PRICING_VERIFIED_AT)}
            </strong>
            . Chaque nom de fournisseur renvoie vers sa page tarifaire officielle. Ces chiffres ne
            sont pas récupérés en temps réel : vérifiez-les avant toute décision d’achat.
          </p>
          <p className="mt-2">
            Conversion en francs CFA au taux de{' '}
            <span className="tabular">{USD_TO_XOF.toLocaleString('fr-FR')}</span> XOF pour 1 USD,
            relevé le {formatDate(FX_RATE_DATE)}. Le franc CFA est arrimé à l’euro (655,957
            XOF/EUR).
          </p>
          <p className="mt-3">
            <a
              href="https://github.com/quickscale-ai/llm-cost-lab"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-500"
            >
              Code source sur GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
