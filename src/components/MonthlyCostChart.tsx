import { useEffect, useState } from 'react'
import type { CostBreakdown } from '../lib/pricing'
import type { Currency } from '../lib/format'
import { formatCurrency } from '../lib/format'
import { maxTotalCost } from '../lib/pricing'

interface Props {
  breakdowns: CostBreakdown[]
  currency: Currency
}

const DESKTOP_CHART_WIDTH = 760
const DESKTOP_LABEL_WIDTH = 220
const DESKTOP_BAR_WIDTH = 430
const DESKTOP_VALUE_X = DESKTOP_LABEL_WIDTH + DESKTOP_BAR_WIDTH + 16
const MOBILE_CHART_WIDTH = 360
const MOBILE_LABEL_WIDTH = 150
const MOBILE_BAR_WIDTH = 92
const MOBILE_VALUE_X = MOBILE_LABEL_WIDTH + MOBILE_BAR_WIDTH + 12
const ROW_HEIGHT = 48

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isMobile
}

/** Graphique en barres SVG, sans dépendance externe, des coûts simulés. */
export function MonthlyCostChart({ breakdowns, currency }: Props) {
  const isMobile = useIsMobile()
  const chartWidth = isMobile ? MOBILE_CHART_WIDTH : DESKTOP_CHART_WIDTH
  const labelWidth = isMobile ? MOBILE_LABEL_WIDTH : DESKTOP_LABEL_WIDTH
  const barWidth = isMobile ? MOBILE_BAR_WIDTH : DESKTOP_BAR_WIDTH
  const valueX = isMobile ? MOBILE_VALUE_X : DESKTOP_VALUE_X
  const ceiling = maxTotalCost(breakdowns)
  const chartHeight = Math.max(breakdowns.length * ROW_HEIGHT, ROW_HEIGHT)

  return (
    <figure>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
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
          const calculatedBarWidth = ceiling > 0 ? (totalCost / ceiling) * barWidth : 0
          const value = formatCurrency(totalCost, currency)

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
                className="fill-slate-700 text-[14px] dark:fill-slate-300"
              >
                {model.name}
              </text>
              <rect
                x={labelWidth}
                y={y + 6}
                width={Math.max(calculatedBarWidth, totalCost > 0 ? 4 : 0)}
                height="24"
                rx="4"
                className="fill-brand-500 dark:fill-brand-500"
                data-cost={totalCost}
              />
              <text
                x={valueX}
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
