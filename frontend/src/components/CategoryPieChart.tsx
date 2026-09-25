import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatMoney } from '../api/client'
import type { CategoryAmount } from '../types/budget'

const CATEGORY_COLORS = [
  '#0f6b5c',
  '#c45c3e',
  '#c9a227',
  '#3d7ea6',
  '#7a5cbf',
  '#2f8f6b',
  '#d17a45',
  '#5b8c5a',
  '#b85c8a',
  '#4a6fa5',
]

interface CategoryPieChartProps {
  title: string
  data: CategoryAmount[]
  emptyLabel: string
}

interface ChartRow {
  name: string
  value: number
  count: number
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: ChartRow }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  return (
    <div className="chart-tooltip">
      <strong>{row.name}</strong>
      <span>{formatMoney(row.value ?? 0)}</span>
      <span className="muted">{row.payload?.count ?? 0} entries</span>
    </div>
  )
}

export default function CategoryPieChart({
  title,
  data,
  emptyLabel,
}: CategoryPieChartProps) {
  const chartData: ChartRow[] = data.map((item) => ({
    name: item.category,
    value: Number(item.total),
    count: item.count,
  }))

  return (
    <div className="panel chart-panel">
      <div className="panel-head">
        <h2>{title}</h2>
      </div>
      {chartData.length === 0 ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    stroke="rgba(255,255,255,0.65)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={42}
                formatter={(value) => <span className="chart-legend">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="category-breakdown">
            {chartData.map((item, index) => {
              const total = chartData.reduce((sum, row) => sum + row.value, 0) || 1
              const pct = ((item.value / total) * 100).toFixed(1)
              return (
                <li key={item.name}>
                  <span
                    className="swatch"
                    style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                  />
                  <span className="cat-name">{item.name}</span>
                  <span className="cat-pct">{pct}%</span>
                  <strong>{formatMoney(item.value)}</strong>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
