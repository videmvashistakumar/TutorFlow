// Cash balance chart: baseline polyline with buffer/zero lines and below-buffer markers; optional scenarioDays draws a dashed "with delay" line.
// Responsive SVG (viewBox, width 100%). Renders inside the page's SectionCard, so it has no outer card of its own.
import { formatCurrency, formatDate } from '../../lib/format.js'

const WIDTH = 600
const HEIGHT = 240
const PAD = 12
const GRID_LINES = 4

export default function ForecastChart({ days, buffer, scenarioDays = null }) {
  if (!days || days.length === 0) {
    return <p className="text-sm text-navy-500">Nothing to chart.</p>
  }

  const hasScenario = Array.isArray(scenarioDays) && scenarioDays.length > 0

  const balances = days.map((d) => d.balance)
  const scenarioBalances = hasScenario ? scenarioDays.map((d) => d.balance) : []
  const values = [...balances, ...scenarioBalances, 0, buffer]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const innerW = WIDTH - PAD * 2
  const innerH = HEIGHT - PAD * 2

  const xFor = (i) =>
    days.length === 1 ? WIDTH / 2 : PAD + (i * innerW) / (days.length - 1)
  const yFor = (v) => PAD + innerH - ((v - min) / range) * innerH

  const points = days.map((d, i) => `${xFor(i).toFixed(2)},${yFor(d.balance).toFixed(2)}`).join(' ')

  // Closed path under the baseline for the subtle area fill.
  const areaPath =
    `M${xFor(0).toFixed(2)},${(HEIGHT - PAD).toFixed(2)} ` +
    days.map((d, i) => `L${xFor(i).toFixed(2)},${yFor(d.balance).toFixed(2)}`).join(' ') +
    ` L${xFor(days.length - 1).toFixed(2)},${(HEIGHT - PAD).toFixed(2)} Z`

  const scenarioCount = hasScenario ? Math.min(days.length, scenarioDays.length) : 0
  const scenarioPoints = hasScenario
    ? scenarioDays
        .slice(0, scenarioCount)
        .map((d, i) => `${xFor(i).toFixed(2)},${yFor(d.balance).toFixed(2)}`)
        .join(' ')
    : ''

  const zeroInRange = 0 >= min && 0 <= max
  const bufferInRange = buffer >= min && buffer <= max
  const gridYs = Array.from({ length: GRID_LINES + 1 }, (_, k) => PAD + (innerH * k) / GRID_LINES)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-navy-600">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 rounded-full bg-emerald-600" aria-hidden="true" />
          Baseline
        </span>
        {hasScenario && (
          <span className="inline-flex items-center gap-2">
            <svg width="20" height="4" aria-hidden="true" className="shrink-0">
              <line x1="0" y1="2" x2="20" y2="2" stroke="#0284c7" strokeWidth="2" strokeDasharray="5 3" />
            </svg>
            With delay
          </span>
        )}
        {bufferInRange && (
          <span className="inline-flex items-center gap-2">
            <svg width="20" height="4" aria-hidden="true" className="shrink-0">
              <line x1="0" y1="2" x2="20" y2="2" stroke="#b45309" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
            Buffer {formatCurrency(buffer)}
          </span>
        )}
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
          Below buffer
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          width="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Projected cash balance chart"
        >
          {gridYs.map((y) => (
            <line
              key={`grid-${y}`}
              x1={PAD}
              x2={WIDTH - PAD}
              y1={y}
              y2={y}
              strokeWidth="1"
              className="stroke-navy-100"
            />
          ))}
          <path d={areaPath} className="fill-emerald-500/10" stroke="none" />
          {zeroInRange && (
            <line
              x1={PAD}
              x2={WIDTH - PAD}
              y1={yFor(0)}
              y2={yFor(0)}
              strokeWidth="1"
              strokeDasharray="4 4"
              className="stroke-navy-500"
            />
          )}
          {bufferInRange && (
            <line
              x1={PAD}
              x2={WIDTH - PAD}
              y1={yFor(buffer)}
              y2={yFor(buffer)}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="stroke-amber-600"
            />
          )}
          <polyline
            points={points}
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-emerald-600"
          />
          {hasScenario && (
            <polyline
              points={scenarioPoints}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
          )}
          {days.map((d, i) =>
            d.belowBuffer ? (
              <circle
                key={d.date}
                cx={xFor(i)}
                cy={yFor(d.balance)}
                r="3.5"
                className="fill-red-600"
              />
            ) : null,
          )}
          {hasScenario &&
            scenarioDays.slice(0, scenarioCount).map((d, i) =>
              d.belowBuffer ? (
                <circle
                  key={`scenario-${d.date ?? i}`}
                  cx={xFor(i)}
                  cy={yFor(d.balance)}
                  r="3.5"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
              ) : null,
            )}
        </svg>
      </div>

      <div className="flex justify-between text-xs text-navy-500">
        <span>{formatDate(days[0].date)}</span>
        {days.length > 1 && <span>{formatDate(days[days.length - 1].date)}</span>}
      </div>
    </div>
  )
}
