from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# --- Income / Expense categories ---


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=80, examples=["Salary"])
    description: str | None = Field(default=None, examples=["Regular paycheck"])


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = None


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# --- Income ---


class IncomeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=120, examples=["Salary"])
    amount: Decimal = Field(..., gt=0, examples=["50000.00"])
    category: str = Field(default="General", max_length=80, examples=["Salary"])
    description: str | None = Field(default=None, examples=["Monthly salary"])
    income_date: date = Field(default_factory=date.today, examples=["2026-09-01"])


class IncomeCreate(IncomeBase):
    pass


class IncomeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    amount: Decimal | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, max_length=80)
    description: str | None = None
    income_date: date | None = None


class IncomeResponse(IncomeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# --- Expense ---


class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=120, examples=["Groceries"])
    amount: Decimal = Field(..., gt=0, examples=["2500.00"])
    category: str = Field(default="General", max_length=80, examples=["Food"])
    description: str | None = Field(default=None, examples=["Weekly groceries"])
    expense_date: date = Field(default_factory=date.today, examples=["2026-09-03"])


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    amount: Decimal | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, max_length=80)
    description: str | None = None
    expense_date: date | None = None


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CategoryAmount(BaseModel):
    category: str
    total: Decimal
    count: int


class BudgetSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    income_count: int
    expense_count: int
    income_by_category: list[CategoryAmount] = []
    expense_by_category: list[CategoryAmount] = []
    start_date: date | None = None
    end_date: date | None = None
