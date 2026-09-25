import { useCallback, useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api/client'
import Modal from '../components/Modal'
import TransactionForm from '../components/TransactionForm'
import TransactionTable from '../components/TransactionTable'
import type { Category, Expense, ExpensePayload } from '../types/budget'

export default function ExpensePage() {
  const [rows, setRows] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await api.listExpenseCategories())
    } catch {
      // keep page usable if category API is down
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listExpenses({
        category: category.trim() || undefined,
        limit: 200,
      })
      setRows(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load expenses'))
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(row: Expense) {
    setEditing(row)
    setModalOpen(true)
  }

  async function handleSubmit(payload: ExpensePayload) {
    setBusy(true)
    try {
      if (editing) {
        await api.updateExpense(editing.id, payload)
      } else {
        await api.createExpense(payload)
      }
      setModalOpen(false)
      setEditing(null)
      await Promise.all([load(), loadCategories()])
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: Expense) {
    if (!window.confirm(`Delete expense “${row.title}”?`)) return
    try {
      await api.deleteExpense(row.id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Delete failed'))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cash out</p>
          <h1>Expense</h1>
          <p className="lede">Track spending with full create, update, and delete against the API.</p>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          Add expense
        </button>
      </header>

      <div className="toolbar">
        <label className="filter">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn ghost"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      <section className="panel">
        <TransactionTable
          kind="expense"
          rows={rows}
          onEdit={openEdit}
          onDelete={(row) => void handleDelete(row)}
          emptyMessage={loading ? 'Loading expenses…' : 'No expense records found.'}
        />
      </section>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit expense' : 'Add expense'}
        onClose={() => {
          if (!busy) setModalOpen(false)
        }}
      >
        <TransactionForm
          kind="expense"
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          busy={busy}
        />
      </Modal>
    </div>
  )
}
