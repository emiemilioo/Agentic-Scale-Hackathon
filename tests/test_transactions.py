from datetime import date

from agent.schemas import Category, ExpenseDraft
from services import transactions


def test_delete_expense(tmp_path, monkeypatch):
    monkeypatch.setattr(transactions, "DB_PATH", tmp_path / "test.db")
    transactions.initialize_database()
    transaction_id = transactions.register_expense(
        ExpenseDraft(
            amount=12.5,
            currency="USD",
            date=date.today(),
            category=Category.ALIMENTACION,
            merchant="Prueba",
            source_text="Gasto de prueba",
        )
    )

    assert transactions.delete_expense(transaction_id) is True
    assert transactions.list_expenses() == []
    assert transactions.delete_expense(transaction_id) is False
