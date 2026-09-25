import { useCallback, useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api/client'
import Modal from '../components/Modal'
import TransactionForm from '../components/TransactionForm'
import TransactionTable from '../components/TransactionTable'
import type { Category, Income, IncomePayload } from '../types/budget'

export default function IncomePage() {
  const [rows, setRows] = useState<Income[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await api.listIncomeCategories())
    } catch {
      // keep filter usable even if categories fail; list still works
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listIncomes({
        category: category.trim() || undefined,
        limit: 200,
      })
      setRows(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load incomes'))
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

  function openEdit(row: Income) {
    setEditing(row)
    setModalOpen(true)
  }

  async function handleSubmit(payload: IncomePayload) {
    setBusy(true)
    try {
      if (editing) {
        await api.updateIncome(editing.id, payload)
      } else {
        await api.createIncome(payload)
      }
      setModalOpen(false)
      setEditing(null)
      await Promise.all([load(), loadCategories()])
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: Income) {
    if (!window.confirm(`Delete income “${row.title}”?`)) return
    try {
      await api.deleteIncome(row.id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Delete failed'))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cash in</p>
          <h1>Income</h1>
          <p className="lede">Create, edit, and remove income records via the Budget API.</p>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          Add income
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
          kind="income"
          rows={rows}
          onEdit={openEdit}
          onDelete={(row) => void handleDelete(row)}
          emptyMessage={loading ? 'Loading incomes…' : 'No income records found.'}
        />
      </section>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit income' : 'Add income'}
        onClose={() => {
          if (!busy) setModalOpen(false)
        }}
      >
        <TransactionForm
          kind="income"
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          busy={busy}
        />
      </Modal>
    </div>
  )
}
