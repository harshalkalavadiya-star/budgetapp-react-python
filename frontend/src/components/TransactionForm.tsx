import { useEffect, useState, type FormEvent } from 'react'
import { api, getErrorMessage, todayISO } from '../api/client'
import type {
  Category,
  Expense,
  ExpensePayload,
  Income,
  IncomePayload,
} from '../types/budget'

interface IncomeFormState {
  title: string
  amount: string
  category: string
  description: string
  income_date: string
}

interface ExpenseFormState {
  title: string
  amount: string
  category: string
  description: string
  expense_date: string
}

type FormState = IncomeFormState | ExpenseFormState

interface IncomeFormProps {
  kind: 'income'
  initial?: Income | null
  onSubmit: (payload: IncomePayload) => Promise<void>
  onCancel: () => void
  busy: boolean
}

interface ExpenseFormProps {
  kind: 'expense'
  initial?: Expense | null
  onSubmit: (payload: ExpensePayload) => Promise<void>
  onCancel: () => void
  busy: boolean
}

type TransactionFormProps = IncomeFormProps | ExpenseFormProps

const emptyIncome = (defaultCategory = ''): IncomeFormState => ({
  title: '',
  amount: '',
  category: defaultCategory,
  description: '',
  income_date: todayISO(),
})

const emptyExpense = (defaultCategory = ''): ExpenseFormState => ({
  title: '',
  amount: '',
  category: defaultCategory,
  description: '',
  expense_date: todayISO(),
})

export default function TransactionForm(props: TransactionFormProps) {
  const { kind, initial, onCancel, busy } = props
  const isIncome = kind === 'income'
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [form, setForm] = useState<FormState>(
    isIncome ? emptyIncome() : emptyExpense(),
  )
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadCategories() {
      setCategoriesLoading(true)
      try {
        const data = isIncome
          ? await api.listIncomeCategories()
          : await api.listExpenseCategories()
        if (!active) return
        setCategories(data)
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, 'Failed to load categories'))
        }
      } finally {
        if (active) setCategoriesLoading(false)
      }
    }
    void loadCategories()
    return () => {
      active = false
    }
  }, [isIncome])

  useEffect(() => {
    const fallback = categories[0]?.name ?? ''
    if (initial) {
      if (kind === 'income' && 'income_date' in initial) {
        setForm({
          title: initial.title || '',
          amount: String(initial.amount ?? ''),
          category: initial.category || fallback,
          description: initial.description || '',
          income_date: initial.income_date || todayISO(),
        })
      } else if (kind === 'expense' && 'expense_date' in initial) {
        setForm({
          title: initial.title || '',
          amount: String(initial.amount ?? ''),
          category: initial.category || fallback,
          description: initial.description || '',
          expense_date: initial.expense_date || todayISO(),
        })
      }
    } else {
      setForm(isIncome ? emptyIncome(fallback) : emptyExpense(fallback))
    }
    setError('')
  }, [initial, isIncome, kind, categories])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const amount = Number(form.amount)
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be greater than 0.')
      return
    }
    if (!form.category.trim()) {
      setError('Please select a category.')
      return
    }

    try {
      if (props.kind === 'income' && 'income_date' in form) {
        await props.onSubmit({
          title: form.title.trim(),
          amount,
          category: form.category.trim(),
          description: form.description.trim() || null,
          income_date: form.income_date,
        })
      } else if (props.kind === 'expense' && 'expense_date' in form) {
        await props.onSubmit({
          title: form.title.trim(),
          amount,
          category: form.category.trim(),
          description: form.description.trim() || null,
          expense_date: form.expense_date,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const dateField: 'income_date' | 'expense_date' = isIncome ? 'income_date' : 'expense_date'
  const dateValue =
    dateField === 'income_date' && 'income_date' in form
      ? form.income_date
      : 'expense_date' in form
        ? form.expense_date
        : todayISO()

  const hasSelected =
    !!form.category && categories.some((c) => c.name === form.category)

  return (
    <form className="form" onSubmit={(e) => void handleSubmit(e)}>
      <label>
        Title
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder={isIncome ? 'Monthly salary' : 'Grocery run'}
          required
        />
      </label>

      <div className="form-row">
        <label>
          Amount (₹)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
            required
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={dateValue}
            onChange={(e) => update(dateField, e.target.value)}
            required
          />
        </label>
      </div>

      <label>
        Category
        <select
          value={hasSelected ? form.category : form.category ? '__custom__' : ''}
          onChange={(e) => {
            const value = e.target.value
            if (value === '__custom__') return
            update('category', value)
          }}
          required
          disabled={categoriesLoading || categories.length === 0}
        >
          <option value="" disabled>
            {categoriesLoading ? 'Loading categories…' : 'Select category'}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
          {!hasSelected && form.category ? (
            <option value="__custom__">{form.category} (legacy)</option>
          ) : null}
        </select>
        {categories.length === 0 && !categoriesLoading ? (
          <span className="field-hint">
            No categories yet. Add some under {isIncome ? 'Income categories' : 'Expense categories'}.
          </span>
        ) : null}
      </label>

      <label>
        Description
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Optional notes"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary"
          disabled={busy || categoriesLoading || categories.length === 0}
        >
          {busy ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
