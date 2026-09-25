# Budget Management — FastAPI + PostgreSQL + React (Vite)

## Project structure

```
pythonDemo/
├── .env
├── create_db.py
├── requirements.txt
├── app/                 # FastAPI backend
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud/
│   └── routers/
└── frontend/            # React + Vite + TypeScript UI
    ├── src/
    │   ├── api/client.ts
    │   ├── types/budget.ts
    │   ├── components/  # *.tsx
    │   ├── pages/       # Dashboard, Income, Expense (*.tsx)
    │   ├── App.tsx
    │   └── main.tsx
    ├── tsconfig.json
    └── .env             # VITE_API_URL
```

## Backend setup

```bash
source demofastapi/bin/activate
python create_db.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger: http://127.0.0.1:8000/docs

## Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173

The UI calls the API at `VITE_API_URL` (default `http://127.0.0.1:8000`). CORS is enabled on FastAPI for the Vite ports.

## Frontend pages

| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/` | Summary totals + recent income/expense |
| Income | `/income` | Full CRUD + category dropdown filter |
| Expense | `/expense` | Full CRUD + category dropdown filter |
| Income categories | `/income-categories` | CRUD for income dropdown options |
| Expense categories | `/expense-categories` | CRUD for expense dropdown options |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST/GET | `/api/v1/incomes/` | Create / list income |
| GET/PUT/DELETE | `/api/v1/incomes/{id}` | Read / update / delete |
| POST/GET | `/api/v1/expenses/` | Create / list expense |
| GET/PUT/DELETE | `/api/v1/expenses/{id}` | Read / update / delete |
| POST/GET | `/api/v1/income-categories/` | Create / list income categories |
| GET/PUT/DELETE | `/api/v1/income-categories/{id}` | Category CRUD |
| POST/GET | `/api/v1/expense-categories/` | Create / list expense categories |
| GET/PUT/DELETE | `/api/v1/expense-categories/{id}` | Category CRUD |
| GET | `/api/v1/budget/summary` | Totals & balance |

On API startup, category tables are created and seeded with defaults; existing income/expense category names are imported automatically.
