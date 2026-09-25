from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.crud import budget as crud
from app.database import get_db
from app.schemas import BudgetSummary

router = APIRouter(prefix="/budget", tags=["Budget Summary"])


@router.get(
    "/summary",
    response_model=BudgetSummary,
    summary="Get budget summary",
    description="Returns totals, balance, and category breakdowns for an optional date range.",
)
def budget_summary(
    start_date: date | None = Query(None, description="Inclusive start date"),
    end_date: date | None = Query(None, description="Inclusive end date"),
    db: Session = Depends(get_db),
):
    return crud.get_budget_summary(db, start_date=start_date, end_date=end_date)
