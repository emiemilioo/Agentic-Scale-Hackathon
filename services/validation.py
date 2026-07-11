from datetime import date

from agent.schemas import ExpenseDraft


def validate_expense(draft: ExpenseDraft, today: date | None = None) -> list[str]:
    """Validaciones semánticas que nunca se delegan al modelo."""
    today = today or date.today()
    errors: list[str] = []
    if draft.amount is None or draft.amount <= 0:
        errors.append("El monto debe ser mayor que cero.")
    if draft.date is None:
        errors.append("La fecha es obligatoria.")
    elif draft.date > today:
        errors.append("La fecha del gasto no puede estar en el futuro.")
    if draft.category is None:
        errors.append("La categoría es obligatoria.")
    if not draft.merchant or not draft.merchant.strip():
        errors.append("El comercio es obligatorio.")
    if draft.currency != "USD":
        errors.append("El MVP solo registra movimientos en USD.")
    return errors

