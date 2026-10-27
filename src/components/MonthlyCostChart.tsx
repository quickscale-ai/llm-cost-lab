import type { CostBreakdown } from '../lib/pricing'
import type { Currency } from '../lib/format'
import { formatCurrency } from '../lib/format'
import { maxTotalCost } from '../lib/pricing'

interface Props {
  breakdowns: CostBreakdown[]
  currency: Currency
}

const CHART_WIDTH = 760
const LABEL_WIDTH = 220
const BAR_WIDTH = 430
const VALUE_X = LABEL_WIDTH + BAR_WIDTH + 16
const ROW_HEIGHT = 48

/** Graphique en barres SVG, sans dépendance externe, des coûts simulés. */
export function MonthlyCostChart({ breakdowns, currency }: Props) {
  const ceiling = maxTotalCost(breakdowns)
  const chartHeight = Math.max(breakdowns.length * ROW_HEIGHT, ROW_HEIGHT)

  return (
    <figure>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${chartHeight}`}
        role="img"
        aria-labelledby="monthly-cost-chart-title monthly-cost-chart-description"
        className="mt-4 h-auto w-full"
      >
        <title id="monthly-cost-chart-title">Coût mensuel par modèle</title>
        <desc id="monthly-cost-chart-description">
          Une barre représente le coût mensuel estimé de chaque modèle affiché, dans la devise sélectionnée.
        </desc>
        {breakdowns.map((breakdown, index) => {
          const { model, totalCost } = breakdown
          const y = index * ROW_HEIGHT + 10
          const barWidth = ceiling > 0 ? (totalCost / ceiling) * BAR_WIDTH : 0
          const value = formatCurrency(totalCost, currency)
          const labelWidth = model.name.length > 22 ? LABEL_WIDTH - 12 : undefined

          return (
            <g
              key={model.id}
              data-model-id={model.id}
              aria-label={`${model.name} : ${value}`}
            >
              <title>{`${model.name} : ${value}`}</title>
              <text
                x="0"
                y={y + 20}
                textLength={labelWidth}
                lengthAdjust={labelWidth ? 'spacingAndGlyphs' : undefined}
                className="fill-slate-700 text-[14px] dark:fill-slate-300"
              >
                {model.name}
              </text>
              <rect
                x={LABEL_WIDTH}
                y={y + 6}
                width={Math.max(barWidth, totalCost > 0 ? 4 : 0)}
                height="24"
                rx="4"
                className="fill-brand-500 dark:fill-brand-500"
                data-cost={totalCost}
              />
              <text
                x={VALUE_X}
                y={y + 20}
                className="tabular fill-slate-900 text-[14px] font-semibold dark:fill-slate-100"
              >
                {value}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="sr-only">
        Les coûts sont calculés à partir de l&apos;usage saisi dans le simulateur et suivent les filtres actifs.
      </figcaption>
    </figure>
  )
}
