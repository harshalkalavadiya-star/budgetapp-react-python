from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas

DEFAULT_INCOME_CATEGORIES = [
    ("General", "Default income category"),
    ("Salary", "Regular employment income"),
    ("Freelance", "Contract / freelance work"),
    ("Investment", "Dividends, interest, capital gains"),
    ("Gift", "Gifts and transfers received"),
    ("Other", "Miscellaneous income"),
]

DEFAULT_EXPENSE_CATEGORIES = [
    ("General", "Default expense category"),
    ("Food", "Groceries and dining"),
    ("Rent", "Housing / rent"),
    ("Transport", "Travel and commute"),
    ("Utilities", "Electricity, water, internet"),
    ("Shopping", "Retail purchases"),
    ("Other", "Miscellaneous expenses"),
]


def _normalize_name(name: str) -> str:
    return " ".join(name.strip().split())


def ensure_income_category_name(db: Session, name: str) -> str:
    """Ensure category exists (create if missing) and return normalized name."""
    normalized = _normalize_name(name) or "General"
    existing = db.scalar(
        select(models.IncomeCategory).where(
            func.lower(models.IncomeCategory.name) == normalized.lower()
        )
    )
    if existing:
        return existing.name
    category = models.IncomeCategory(name=normalized, description=None)
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(models.IncomeCategory).where(
                func.lower(models.IncomeCategory.name) == normalized.lower()
            )
        )
        if existing:
            return existing.name
        raise
    return category.name


def ensure_expense_category_name(db: Session, name: str) -> str:
    normalized = _normalize_name(name) or "General"
    existing = db.scalar(
        select(models.ExpenseCategory).where(
            func.lower(models.ExpenseCategory.name) == normalized.lower()
        )
    )
    if existing:
        return existing.name
    category = models.ExpenseCategory(name=normalized, description=None)
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(models.ExpenseCategory).where(
                func.lower(models.ExpenseCategory.name) == normalized.lower()
            )
        )
        if existing:
            return existing.name
        raise
    return category.name


def seed_categories(db: Session) -> None:
    """Create default categories and import names already used on transactions."""
    for name, description in DEFAULT_INCOME_CATEGORIES:
        exists = db.scalar(
            select(models.IncomeCategory.id).where(
                func.lower(models.IncomeCategory.name) == name.lower()
            )
        )
        if not exists:
            db.add(models.IncomeCategory(name=name, description=description))

    for name, description in DEFAULT_EXPENSE_CATEGORIES:
        exists = db.scalar(
            select(models.ExpenseCategory.id).where(
                func.lower(models.ExpenseCategory.name) == name.lower()
            )
        )
        if not exists:
            db.add(models.ExpenseCategory(name=name, description=description))

    db.commit()

    used_income = db.scalars(select(models.Income.category).distinct()).all()
    for name in used_income:
        if name:
            ensure_income_category_name(db, name)

    used_expense = db.scalars(select(models.Expense.category).distinct()).all()
    for name in used_expense:
        if name:
            ensure_expense_category_name(db, name)


# --- Income category CRUD ---


def create_income_category(
    db: Session, payload: schemas.CategoryCreate
) -> models.IncomeCategory:
    category = models.IncomeCategory(
        name=_normalize_name(payload.name),
        description=payload.description,
    )
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Income category with this name already exists",
        )
    return category


def get_income_category(db: Session, category_id: int) -> models.IncomeCategory | None:
    return db.get(models.IncomeCategory, category_id)


def list_income_categories(db: Session) -> list[models.IncomeCategory]:
    stmt = select(models.IncomeCategory).order_by(models.IncomeCategory.name.asc())
    return list(db.scalars(stmt).all())


def update_income_category(
    db: Session, category: models.IncomeCategory, payload: schemas.CategoryUpdate
) -> models.IncomeCategory:
    data = payload.model_dump(exclude_unset=True)
    old_name = category.name
    if "name" in data and data["name"] is not None:
        data["name"] = _normalize_name(data["name"])
    for field, value in data.items():
        setattr(category, field, value)
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Income category with this name already exists",
        )

    if "name" in data and data["name"] != old_name:
        incomes = db.scalars(
            select(models.Income).where(models.Income.category == old_name)
        ).all()
        for income in incomes:
            income.category = category.name
            db.add(income)
        db.commit()
        db.refresh(category)
    return category


def delete_income_category(db: Session, category: models.IncomeCategory) -> None:
    in_use = db.scalar(
        select(func.count(models.Income.id)).where(
            models.Income.category == category.name
        )
    )
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category '{category.name}' — used by {in_use} income record(s)",
        )
    db.delete(category)
    db.commit()


# --- Expense category CRUD ---


def create_expense_category(
    db: Session, payload: schemas.CategoryCreate
) -> models.ExpenseCategory:
    category = models.ExpenseCategory(
        name=_normalize_name(payload.name),
        description=payload.description,
    )
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Expense category with this name already exists",
        )
    return category


def get_expense_category(db: Session, category_id: int) -> models.ExpenseCategory | None:
    return db.get(models.ExpenseCategory, category_id)


def list_expense_categories(db: Session) -> list[models.ExpenseCategory]:
    stmt = select(models.ExpenseCategory).order_by(models.ExpenseCategory.name.asc())
    return list(db.scalars(stmt).all())


def update_expense_category(
    db: Session, category: models.ExpenseCategory, payload: schemas.CategoryUpdate
) -> models.ExpenseCategory:
    data = payload.model_dump(exclude_unset=True)
    old_name = category.name
    if "name" in data and data["name"] is not None:
        data["name"] = _normalize_name(data["name"])
    for field, value in data.items():
        setattr(category, field, value)
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Expense category with this name already exists",
        )

    if "name" in data and data["name"] != old_name:
        expenses = db.scalars(
            select(models.Expense).where(models.Expense.category == old_name)
        ).all()
        for expense in expenses:
            expense.category = category.name
            db.add(expense)
        db.commit()
        db.refresh(category)
    return category


def delete_expense_category(db: Session, category: models.ExpenseCategory) -> None:
    in_use = db.scalar(
        select(func.count(models.Expense.id)).where(
            models.Expense.category == category.name
        )
    )
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category '{category.name}' — used by {in_use} expense record(s)",
        )
    db.delete(category)
    db.commit()


# --- Income CRUD ---


def create_income(db: Session, payload: schemas.IncomeCreate) -> models.Income:
    data = payload.model_dump()
    data["category"] = ensure_income_category_name(db, data.get("category") or "General")
    income = models.Income(**data)
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


def get_income(db: Session, income_id: int) -> models.Income | None:
    return db.get(models.Income, income_id)


def list_incomes(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    start_date=None,
    end_date=None,
) -> list[models.Income]:
    stmt = select(models.Income).order_by(models.Income.income_date.desc())
    if category:
        stmt = stmt.where(models.Income.category == category)
    if start_date is not None:
        stmt = stmt.where(models.Income.income_date >= start_date)
    if end_date is not None:
        stmt = stmt.where(models.Income.income_date <= end_date)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def update_income(
    db: Session, income: models.Income, payload: schemas.IncomeUpdate
) -> models.Income:
    data = payload.model_dump(exclude_unset=True)
    if "category" in data and data["category"] is not None:
        data["category"] = ensure_income_category_name(db, data["category"])
    for field, value in data.items():
        setattr(income, field, value)
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income: models.Income) -> None:
    db.delete(income)
    db.commit()


# --- Expense CRUD ---


def create_expense(db: Session, payload: schemas.ExpenseCreate) -> models.Expense:
    data = payload.model_dump()
    data["category"] = ensure_expense_category_name(db, data.get("category") or "General")
    expense = models.Expense(**data)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_expense(db: Session, expense_id: int) -> models.Expense | None:
    return db.get(models.Expense, expense_id)


def list_expenses(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    start_date=None,
    end_date=None,
) -> list[models.Expense]:
    stmt = select(models.Expense).order_by(models.Expense.expense_date.desc())
    if category:
        stmt = stmt.where(models.Expense.category == category)
    if start_date is not None:
        stmt = stmt.where(models.Expense.expense_date >= start_date)
    if end_date is not None:
        stmt = stmt.where(models.Expense.expense_date <= end_date)
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def update_expense(
    db: Session, expense: models.Expense, payload: schemas.ExpenseUpdate
) -> models.Expense:
    data = payload.model_dump(exclude_unset=True)
    if "category" in data and data["category"] is not None:
        data["category"] = ensure_expense_category_name(db, data["category"])
    for field, value in data.items():
        setattr(expense, field, value)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense: models.Expense) -> None:
    db.delete(expense)
    db.commit()


def get_budget_summary(
    db: Session, *, start_date=None, end_date=None
) -> schemas.BudgetSummary:
    income_filters = []
    expense_filters = []
    if start_date is not None:
        income_filters.append(models.Income.income_date >= start_date)
        expense_filters.append(models.Expense.expense_date >= start_date)
    if end_date is not None:
        income_filters.append(models.Income.income_date <= end_date)
        expense_filters.append(models.Expense.expense_date <= end_date)

    total_income = db.scalar(
        select(func.coalesce(func.sum(models.Income.amount), 0)).where(*income_filters)
    ) or Decimal("0")
    total_expense = db.scalar(
        select(func.coalesce(func.sum(models.Expense.amount), 0)).where(*expense_filters)
    ) or Decimal("0")
    income_count = db.scalar(
        select(func.count(models.Income.id)).where(*income_filters)
    ) or 0
    expense_count = db.scalar(
        select(func.count(models.Expense.id)).where(*expense_filters)
    ) or 0

    income_rows = db.execute(
        select(
            models.Income.category,
            func.coalesce(func.sum(models.Income.amount), 0),
            func.count(models.Income.id),
        )
        .where(*income_filters)
        .group_by(models.Income.category)
        .order_by(func.sum(models.Income.amount).desc())
    ).all()
    expense_rows = db.execute(
        select(
            models.Expense.category,
            func.coalesce(func.sum(models.Expense.amount), 0),
            func.count(models.Expense.id),
        )
        .where(*expense_filters)
        .group_by(models.Expense.category)
        .order_by(func.sum(models.Expense.amount).desc())
    ).all()

    return schemas.BudgetSummary(
        total_income=Decimal(total_income),
        total_expense=Decimal(total_expense),
        balance=Decimal(total_income) - Decimal(total_expense),
        income_count=int(income_count),
        expense_count=int(expense_count),
        income_by_category=[
            schemas.CategoryAmount(
                category=row[0] or "General",
                total=Decimal(row[1]),
                count=int(row[2]),
            )
            for row in income_rows
        ],
        expense_by_category=[
            schemas.CategoryAmount(
                category=row[0] or "General",
                total=Decimal(row[1]),
                count=int(row[2]),
            )
            for row in expense_rows
        ],
        start_date=start_date,
        end_date=end_date,
    )
