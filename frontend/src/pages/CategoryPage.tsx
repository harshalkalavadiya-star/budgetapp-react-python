import { useCallback, useEffect, useState } from 'react'
import { api, getErrorMessage } from '../api/client'
import type { Category, CategoryKind, CategoryPayload } from '../types/budget'
import CategoryForm from '../components/CategoryForm'
import Modal from '../components/Modal'

interface CategoryPageProps {
  kind: CategoryKind
}

export default function CategoryPage({ kind }: CategoryPageProps) {
  const isIncome = kind === 'income'
  const [rows, setRows] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = isIncome
        ? await api.listIncomeCategories()
        : await api.listExpenseCategories()
      setRows(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load categories'))
    } finally {
      setLoading(false)
    }
  }, [isIncome])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(row: Category) {
    setEditing(row)
    setModalOpen(true)
  }

  async function handleSubmit(payload: CategoryPayload) {
    setBusy(true)
    try {
      if (editing) {
        if (isIncome) await api.updateIncomeCategory(editing.id, payload)
        else await api.updateExpenseCategory(editing.id, payload)
      } else if (isIncome) {
        await api.createIncomeCategory(payload)
      } else {
        await api.createExpenseCategory(payload)
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: Category) {
    if (!window.confirm(`Delete category “${row.name}”?`)) return
    try {
      if (isIncome) await api.deleteIncomeCategory(row.id)
      else await api.deleteExpenseCategory(row.id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Delete failed'))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{isIncome ? 'Income setup' : 'Expense setup'}</p>
          <h1>{isIncome ? 'Income categories' : 'Expense categories'}</h1>
          <p className="lede">
            Manage dropdown options used when adding or editing{' '}
            {isIncome ? 'income' : 'expense'} records.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          Add category
        </button>
      </header>

      <div className="toolbar">
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
        {!rows.length ? (
          <p className="empty-state">
            {loading ? 'Loading categories…' : 'No categories yet. Add your first one.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="chip">{row.name}</span>
                    </td>
                    <td>{row.description || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn danger sm"
                          onClick={() => void handleDelete(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        title={
          editing
            ? `Edit ${isIncome ? 'income' : 'expense'} category`
            : `Add ${isIncome ? 'income' : 'expense'} category`
        }
        onClose={() => {
          if (!busy) setModalOpen(false)
        }}
      >
        <CategoryForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          busy={busy}
        />
      </Modal>
    </div>
  )
}
