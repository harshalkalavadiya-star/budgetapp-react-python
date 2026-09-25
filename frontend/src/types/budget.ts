export type TransactionKind = 'income' | 'expense'
export type CategoryKind = 'income' | 'expense'

export interface CategoryAmount {
  category: string
  total: string | number
  count: number
}

export interface BudgetSummary {
  total_income: string | number
  total_expense: string | number
  balance: string | number
  income_count: number
  expense_count: number
  income_by_category?: CategoryAmount[]
  expense_by_category?: CategoryAmount[]
  start_date?: string | null
  end_date?: string | null
}

export interface Category {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface CategoryPayload {
  name: string
  description: string | null
}

export interface Income {
  id: number
  title: string
  amount: string | number
  category: string
  description: string | null
  income_date: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: number
  title: string
  amount: string | number
  category: string
  description: string | null
  expense_date: string
  created_at: string
  updated_at: string
}

export interface IncomePayload {
  title: string
  amount: number
  category: string
  description: string | null
  income_date: string
}

export interface ExpensePayload {
  title: string
  amount: number
  category: string
  description: string | null
  expense_date: string
}

export type TransactionPayload = IncomePayload | ExpensePayload

export interface ListParams {
  category?: string
  limit?: number
  start_date?: string
  end_date?: string
}

export interface SummaryParams {
  start_date?: string
  end_date?: string
}
