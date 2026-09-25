from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import budget as crud
from app.database import get_db
from app.schemas import ExpenseCreate, ExpenseResponse, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Expense"])


@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create expense",
)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    return crud.create_expense(db, payload)


@router.get("/", response_model=list[ExpenseResponse], summary="List expenses")
def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: str | None = Query(None, description="Filter by category"),
    start_date: date | None = Query(None, description="Inclusive start date"),
    end_date: date | None = Query(None, description="Inclusive end date"),
    db: Session = Depends(get_db),
):
    return crud.list_expenses(
        db,
        skip=skip,
        limit=limit,
        category=category,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse, summary="Get expense by ID")
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = crud.get_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseResponse, summary="Update expense")
def update_expense(expense_id: int, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = crud.get_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return crud.update_expense(db, expense, payload)


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete expense",
)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = crud.get_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    crud.delete_expense(db, expense)
    return None
