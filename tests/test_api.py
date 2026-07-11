from datetime import date

from backend.api_schemas import ConfirmExpenseRequest, InterpretRequest
from agent.schemas import Category, ExpenseDraft


def test_interpret_request_rejects_empty_message():
    try:
        InterpretRequest(message="")
        assert False, "El mensaje vacío debió ser rechazado"
    except ValueError:
        pass


def test_confirmation_contract():
    draft = ExpenseDraft(
        amount=25,
        currency="USD",
        date=date.today(),
        category=Category.ALIMENTACION,
        merchant="Mi Comisariato",
        source_text="Gasté 25 dólares",
    )
    payload = ConfirmExpenseRequest(draft=draft, confirmed=True)
    assert payload.confirmed is True
    assert payload.draft.amount == 25

