import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatMoney, getErrorMessage } from '../api/client'
import CategoryPieChart from '../components/CategoryPieChart'
import type { BudgetSummary, Expense, Income } from '../types/budget'
import {
  formatRangeLabel,
  resolveDateRange,
  type DatePreset,
} from '../utils/dateRange'

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
  { id: 'custom', label: 'Custom' },
]

export default function Dashboard() {
  const [preset, setPreset] = useState<DatePreset>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [recentIncome, setRecentIncome] = useState<Income[]>([])
  const [recentExpense, setRecentExpense] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const range = useMemo(
    () => resolveDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  )

  const load = useCallback(async () => {
    if (preset === 'custom' && (!customStart || !customEnd)) {
      setError('Pick both start and end dates for a custom range.')
      setLoading(false)
      return
    }
    if (preset === 'custom' && customStart > customEnd) {
      setError('Start date must be on or before end date.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    const params = { start_date: range.start, end_date: range.end }
    try {
      const [s, incomes, expenses] = await Promise.all([
        api.getSummary(params),
        api.listIncomes({ ...params, limit: 8 }),
        api.listExpenses({ ...params, limit: 8 }),
      ])
      setSummary(s)
      setRecentIncome(incomes)
      setRecentExpense(expenses)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard'))
    } finally {
      setLoading(false)
    }
  }, [preset, customStart, customEnd, range.start, range.end])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p className="lede">
            Category charts and ledger entries for {formatRangeLabel(range)}.
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </header>

      <section className="date-filter panel">
        <div className="preset-row" role="tablist" aria-label="Date range">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={preset === item.id}
              className={`preset-btn${preset === item.id ? ' active' : ''}`}
              onClick={() => setPreset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {preset === 'custom' ? (
          <div className="custom-range">
            <label className="filter">
              From
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </label>
            <label className="filter">
              To
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="banner error">
          <strong>API error:</strong> {error}
          <span> Make sure FastAPI is running on port 8000.</span>
        </div>
      ) : null}

      {loading && !summary ? <p className="muted">Loading dashboard…</p> : null}

      {summary ? (
        <section className="stat-grid">
          <article className="stat income">
            <p className="stat-label">Total income</p>
            <p className="stat-value">{formatMoney(summary.total_income)}</p>
            <p className="stat-meta">{summary.income_count} entries in range</p>
          </article>
          <article className="stat expense">
            <p className="stat-label">Total expense</p>
            <p className="stat-value">{formatMoney(summary.total_expense)}</p>
            <p className="stat-meta">{summary.expense_count} entries in range</p>
          </article>
          <article className="stat balance">
            <p className="stat-label">Balance</p>
            <p className="stat-value">{formatMoney(summary.balance)}</p>
            <p className="stat-meta">Income − expense</p>
          </article>
        </section>
      ) : null}

      <section className="split-panels chart-grid">
        <CategoryPieChart
          title="Income by category"
          data={summary?.income_by_category ?? []}
          emptyLabel="No income in this date range."
        />
        <CategoryPieChart
          title="Expenses by category"
          data={summary?.expense_by_category ?? []}
          emptyLabel="No expenses in this date range."
        />
      </section>

      <section className="split-panels">
        <div className="panel">
          <div className="panel-head">
            <h2>Income in range</h2>
            <Link to="/income" className="text-link">
              Manage
            </Link>
          </div>
          {recentIncome.length === 0 ? (
            <p className="empty-state">No income in this date range.</p>
          ) : (
            <ul className="feed">
              {recentIncome.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.category} · {item.income_date}
                    </span>
                  </div>
                  <em className="pos">{formatMoney(item.amount)}</em>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Expenses in range</h2>
            <Link to="/expense" className="text-link">
              Manage
            </Link>
          </div>
          {recentExpense.length === 0 ? (
            <p className="empty-state">No expenses in this date range.</p>
          ) : (
            <ul className="feed">
              {recentExpense.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.category} · {item.expense_date}
                    </span>
                  </div>
                  <em className="neg">{formatMoney(item.amount)}</em>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
