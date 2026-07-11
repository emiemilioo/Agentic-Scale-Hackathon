from datetime import date

from agent.gemini_client import ExpenseExtractor
from agent.schemas import Category


def test_complete_expense_in_demo_mode():
    extractor = ExpenseExtractor(api_key=None)
    extractor.api_key = None
    draft = extractor.extract(
        "Gasté 25 dólares en comida ayer en Mi Comisariato",
        today=date(2026, 7, 11),
    )
    assert draft.amount == 25
    assert draft.date == date(2026, 7, 10)
    assert draft.category == Category.ALIMENTACION
    assert draft.merchant == "Mi Comisariato"
    assert draft.requires_clarification is False


def test_ambiguous_expense_requests_category():
    extractor = ExpenseExtractor(api_key=None)
    extractor.api_key = None
    draft = extractor.extract(
        "Pagué 18 en La Esquina ayer",
        today=date(2026, 7, 11),
    )
    assert draft.amount == 18
    assert draft.category is None
    assert "category" in draft.missing_fields
    assert draft.requires_clarification is True

