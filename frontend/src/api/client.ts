import type {
  BudgetSummary,
  Category,
  CategoryPayload,
  Expense,
  ExpensePayload,
  Income,
  IncomePayload,
  ListParams,
  SummaryParams,
} from '../types/budget'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (response.status === 204) {
    return null as T
  }

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      (data as { detail: unknown }).detail !== undefined
        ? typeof (data as { detail: unknown }).detail === 'string'
          ? (data as { detail: string }).detail
          : JSON.stringify((data as { detail: unknown }).detail)
        : `Request failed (${response.status})`
    throw new Error(detail)
  }

  return data as T
}

function buildQuery(params: ListParams | SummaryParams = {}): string {
  const q = new URLSearchParams()
  if ('category' in params && params.category) q.set('category', params.category)
  if ('limit' in params && params.limit) q.set('limit', String(params.limit))
  if (params.start_date) q.set('start_date', params.start_date)
  if (params.end_date) q.set('end_date', params.end_date)
  const qs = q.toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  getSummary: (params: SummaryParams = {}) =>
    request<BudgetSummary>(`/api/v1/budget/summary${buildQuery(params)}`),

  listIncomes: (params: ListParams = {}) =>
    request<Income[]>(`/api/v1/incomes/${buildQuery(params)}`),

  createIncome: (payload: IncomePayload) =>
    request<Income>('/api/v1/incomes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateIncome: (id: number, payload: IncomePayload) =>
    request<Income>(`/api/v1/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteIncome: (id: number) =>
    request<null>(`/api/v1/incomes/${id}`, { method: 'DELETE' }),

  listExpenses: (params: ListParams = {}) =>
    request<Expense[]>(`/api/v1/expenses/${buildQuery(params)}`),

  createExpense: (payload: ExpensePayload) =>
    request<Expense>('/api/v1/expenses/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateExpense: (id: number, payload: ExpensePayload) =>
    request<Expense>(`/api/v1/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteExpense: (id: number) =>
    request<null>(`/api/v1/expenses/${id}`, { method: 'DELETE' }),

  listIncomeCategories: () =>
    request<Category[]>('/api/v1/income-categories/'),

  createIncomeCategory: (payload: CategoryPayload) =>
    request<Category>('/api/v1/income-categories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateIncomeCategory: (id: number, payload: CategoryPayload) =>
    request<Category>(`/api/v1/income-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteIncomeCategory: (id: number) =>
    request<null>(`/api/v1/income-categories/${id}`, { method: 'DELETE' }),

  listExpenseCategories: () =>
    request<Category[]>('/api/v1/expense-categories/'),

  createExpenseCategory: (payload: CategoryPayload) =>
    request<Category>('/api/v1/expense-categories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateExpenseCategory: (id: number, payload: CategoryPayload) =>
    request<Category>(`/api/v1/expense-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteExpenseCategory: (id: number) =>
    request<null>(`/api/v1/expense-categories/${id}`, { method: 'DELETE' }),
}

export function formatMoney(value: string | number | null | undefined): string {
  const num = Number(value ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  return fallback
}
