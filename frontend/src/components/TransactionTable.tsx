import { formatMoney } from '../api/client'
import type { Expense, Income } from '../types/budget'

interface IncomeTableProps {
  kind: 'income'
  rows: Income[]
  onEdit: (row: Income) => void
  onDelete: (row: Income) => void
  emptyMessage: string
}

interface ExpenseTableProps {
  kind: 'expense'
  rows: Expense[]
  onEdit: (row: Expense) => void
  onDelete: (row: Expense) => void
  emptyMessage: string
}

type TransactionTableProps = IncomeTableProps | ExpenseTableProps

export default function TransactionTable(props: TransactionTableProps) {
  const { kind, rows, emptyMessage } = props

  if (!rows.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Date</th>
            <th className="num">Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const dateValue =
              kind === 'income' && 'income_date' in row
                ? row.income_date
                : 'expense_date' in row
                  ? row.expense_date
                  : ''

            return (
              <tr key={row.id}>
                <td>
                  <div className="cell-title">{row.title}</div>
                  {row.description ? (
                    <div className="cell-sub">{row.description}</div>
                  ) : null}
                </td>
                <td>
                  <span className="chip">{row.category}</span>
                </td>
                <td>{dateValue}</td>
                <td className={`num ${kind === 'income' ? 'pos' : 'neg'}`}>
                  {formatMoney(row.amount)}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => {
                        if (props.kind === 'income' && 'income_date' in row) {
                          props.onEdit(row)
                        } else if (props.kind === 'expense' && 'expense_date' in row) {
                          props.onEdit(row)
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger sm"
                      onClick={() => {
                        if (props.kind === 'income' && 'income_date' in row) {
                          props.onDelete(row)
                        } else if (props.kind === 'expense' && 'expense_date' in row) {
                          props.onDelete(row)
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
