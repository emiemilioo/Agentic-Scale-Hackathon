from services.budgets import evaluate_budget


def test_budget_is_ok_below_threshold():
    result = evaluate_budget(spent=20, amount_limit=100, threshold_pct=80)
    assert result == {"percentage": 20.0, "threshold_amount": 80.0, "status": "ok"}


def test_budget_warns_at_threshold():
    result = evaluate_budget(spent=43, amount_limit=50, threshold_pct=80)
    assert result["percentage"] == 86.0
    assert result["threshold_amount"] == 40.0
    assert result["status"] == "warning"


def test_budget_detects_excess():
    result = evaluate_budget(spent=55, amount_limit=50, threshold_pct=80)
    assert result["status"] == "exceeded"

