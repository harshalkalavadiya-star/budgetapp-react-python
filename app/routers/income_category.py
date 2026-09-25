from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import budget as crud
from app.database import get_db
from app.schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/income-categories", tags=["Income Categories"])


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create income category",
)
def create_income_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_income_category(db, payload)


@router.get("/", response_model=list[CategoryResponse], summary="List income categories")
def list_income_categories(db: Session = Depends(get_db)):
    return crud.list_income_categories(db)


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get income category by ID",
)
def get_income_category(category_id: int, db: Session = Depends(get_db)):
    category = crud.get_income_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income category not found")
    return category


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update income category",
)
def update_income_category(
    category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)
):
    category = crud.get_income_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income category not found")
    return crud.update_income_category(db, category, payload)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete income category",
)
def delete_income_category(category_id: int, db: Session = Depends(get_db)):
    category = crud.get_income_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income category not found")
    crud.delete_income_category(db, category)
    return None
