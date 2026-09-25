from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import budget as crud
from app.database import get_db
from app.schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/expense-categories", tags=["Expense Categories"])


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create expense category",
)
def create_expense_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_expense_category(db, payload)


@router.get("/", response_model=list[CategoryResponse], summary="List expense categories")
def list_expense_categories(db: Session = Depends(get_db)):
    return crud.list_expense_categories(db)


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get expense category by ID",
)
def get_expense_category(category_id: int, db: Session = Depends(get_db)):
    category = crud.get_expense_category(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found"
        )
    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update expense category",
)
def update_expense_category(
    category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)
):
    category = crud.get_expense_category(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found"
        )
    return crud.update_expense_category(db, category, payload)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete expense category",
)
def delete_expense_category(category_id: int, db: Session = Depends(get_db)):
    category = crud.get_expense_category(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found"
        )
    crud.delete_expense_category(db, category)
    return None
