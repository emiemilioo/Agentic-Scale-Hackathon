import sqlite3
from pathlib import Path

from agent.schemas import ExpenseDraft

DB_PATH = Path(__file__).resolve().parents[1] / "saldo_claro.db"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL CHECK(amount > 0),
                currency TEXT NOT NULL,
                transaction_date TEXT NOT NULL,
                category TEXT NOT NULL,
                merchant TEXT NOT NULL,
                source_text TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def register_expense(draft: ExpenseDraft) -> int:
    """Esta función solo debe llamarse después de validar y confirmar."""
    with connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO transactions
                (amount, currency, transaction_date, category, merchant, source_text)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                draft.amount,
                draft.currency,
                draft.date.isoformat(),
                draft.category.value,
                draft.merchant,
                draft.source_text,
            ),
        )
        return int(cursor.lastrowid)


def list_expenses() -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def total_expenses() -> float:
    with connect() as connection:
        row = connection.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions").fetchone()
    return float(row["total"])

