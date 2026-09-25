from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.crud.budget import seed_categories
from app.database import Base, SessionLocal, engine
from app.routers import expense, expense_category, income, income_category, summary


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables on startup (simple alternative to Alembic for this demo)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_categories(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Budget Management API",
    description=(
        "CRUD APIs for managing Income, Expense, and Categories with FastAPI + PostgreSQL. "
        "Open `/docs` for interactive Swagger UI."
    ),
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    # Vite may jump to 5174/5175 when 5173 is busy; allow any local Vite/preview port.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):(4173|517\d)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(income.router, prefix="/api/v1")
app.include_router(expense.router, prefix="/api/v1")
app.include_router(income_category.router, prefix="/api/v1")
app.include_router(expense_category.router, prefix="/api/v1")
app.include_router(summary.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Budget Management API is running",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
