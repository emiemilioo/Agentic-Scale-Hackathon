from datetime import date, timedelta

from agent.schemas import Category, ExpenseDraft
from services.validation import validate_expense


def valid_draft() -> ExpenseDraft:
    return ExpenseDraft(
        amount=25,
        currency="USD",
        date=date.today(),
        category=Category.ALIMENTACION,
        merchant="Mi Comisariato",
        source_text="mensaje",
    )


def test_valid_expense_has_no_errors():
    assert validate_expense(valid_draft()) == []


def test_future_date_is_rejected():
    draft = valid_draft()
    draft.date = date.today() + timedelta(days=1)
    assert "La fecha del gasto no puede estar en el futuro." in validate_expense(draft)


def test_non_positive_amount_is_rejected():
    draft = valid_draft()
    draft.amount = 0
    assert "El monto debe ser mayor que cero." in validate_expense(draft)
