from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import budget as crud
from app.database import get_db
from app.schemas import IncomeCreate, IncomeResponse, IncomeUpdate

router = APIRouter(prefix="/incomes", tags=["Income"])


@router.post(
    "/",
    response_model=IncomeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create income",
)
def create_income(payload: IncomeCreate, db: Session = Depends(get_db)):
    return crud.create_income(db, payload)


@router.get("/", response_model=list[IncomeResponse], summary="List incomes")
def list_incomes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: str | None = Query(None, description="Filter by category"),
    start_date: date | None = Query(None, description="Inclusive start date"),
    end_date: date | None = Query(None, description="Inclusive end date"),
    db: Session = Depends(get_db),
):
    return crud.list_incomes(
        db,
        skip=skip,
        limit=limit,
        category=category,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/{income_id}", response_model=IncomeResponse, summary="Get income by ID")
def get_income(income_id: int, db: Session = Depends(get_db)):
    income = crud.get_income(db, income_id)
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    return income


@router.put("/{income_id}", response_model=IncomeResponse, summary="Update income")
def update_income(income_id: int, payload: IncomeUpdate, db: Session = Depends(get_db)):
    income = crud.get_income(db, income_id)
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    return crud.update_income(db, income, payload)


@router.delete(
    "/{income_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete income",
)
def delete_income(income_id: int, db: Session = Depends(get_db)):
    income = crud.get_income(db, income_id)
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    crud.delete_income(db, income)
    return None
