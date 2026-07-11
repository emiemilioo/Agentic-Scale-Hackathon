from __future__ import annotations

from datetime import date as Date
from enum import Enum

from pydantic import BaseModel, Field


class Category(str, Enum):
    ALIMENTACION = "Alimentación"
    TRANSPORTE = "Transporte"
    VIVIENDA = "Vivienda"
    SALUD = "Salud"
    EDUCACION = "Educación"
    ENTRETENIMIENTO = "Entretenimiento"
    SERVICIOS = "Servicios"
    OTROS = "Otros"


class ExpenseDraft(BaseModel):
    """Borrador estructurado. Todavía no representa una escritura en la BD."""

    amount: float | None = Field(default=None, description="Monto positivo del gasto")
    currency: str | None = Field(default=None, description="Código ISO, normalmente USD")
    date: Date | None = Field(default=None, description="Fecha del gasto")
    category: Category | None = None
    merchant: str | None = None
    missing_fields: list[str] = Field(default_factory=list)
    requires_clarification: bool = False
    clarification_question: str | None = None
    source_text: str = ""
