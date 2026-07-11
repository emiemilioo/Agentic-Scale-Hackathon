import json
import os
import re
from datetime import date, timedelta

from pydantic import ValidationError

from agent.schemas import Category, ExpenseDraft

try:
    from dotenv import load_dotenv
except ImportError:  # Permite ejecutar el modo demo antes de instalar dependencias opcionales.
    def load_dotenv() -> bool:
        return False

load_dotenv()


SYSTEM_INSTRUCTION = """
Eres el componente de extracción de Saldo Claro. Convierte un mensaje de gasto
en datos estructurados. No inventes información. Si no puedes identificar monto,
fecha, categoría o comercio, usa null, incluye el nombre del campo en
missing_fields y formula una pregunta breve. Interpreta fechas relativas usando
la fecha actual y America/Guayaquil. La moneda predeterminada del perfil es USD,
pero debes conservar la moneda indicada por el usuario. Categorías permitidas:
Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Servicios
y Otros. No registres ni confirmes operaciones; solo crea un borrador.
""".strip()


class ExpenseExtractor:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    @property
    def mode(self) -> str:
        return "Gemini API" if self.api_key else "Demo local"

    def extract(self, message: str, today: date | None = None) -> ExpenseDraft:
        message = message.strip()
        if not message:
            raise ValueError("Escribe un mensaje antes de continuar.")
        today = today or date.today()
        if not self.api_key:
            return self._demo_extract(message, today)
        return self._gemini_extract(message, today)

    def _gemini_extract(self, message: str, today: date) -> ExpenseDraft:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)
        prompt = (
            f"Fecha actual: {today.isoformat()}. Zona: America/Guayaquil.\n"
            f"Mensaje del usuario: {message}"
        )
        try:
            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=ExpenseDraft,
                    temperature=0.1,
                ),
            )
            if getattr(response, "parsed", None):
                draft = ExpenseDraft.model_validate(response.parsed)
            else:
                draft = ExpenseDraft.model_validate_json(response.text)
        except (ValidationError, json.JSONDecodeError) as exc:
            raise RuntimeError("Gemini respondió, pero los datos no pasaron la validación.") from exc
        except Exception as exc:
            raise RuntimeError(f"No fue posible consultar Gemini: {exc}") from exc
        draft.source_text = message
        return draft

    def _demo_extract(self, message: str, today: date) -> ExpenseDraft:
        """Fallback didáctico. No pretende sustituir a Gemini."""
        lower = message.lower()
        amount_match = re.search(r"(?:\$\s*)?(\d+(?:[.,]\d{1,2})?)", lower)
        amount = float(amount_match.group(1).replace(",", ".")) if amount_match else None
        expense_date = today - timedelta(days=1) if "ayer" in lower else today
        category = None
        category_words = {
            Category.ALIMENTACION: ("comida", "alimentación", "supermercado", "almuerzo", "cena"),
            Category.TRANSPORTE: ("bus", "taxi", "uber", "transporte", "gasolina"),
            Category.SALUD: ("farmacia", "médico", "salud"),
            Category.ENTRETENIMIENTO: ("cine", "netflix", "entretenimiento"),
            Category.SERVICIOS: ("luz", "agua", "internet", "servicio"),
        }
        for candidate, words in category_words.items():
            if any(word in lower for word in words):
                category = candidate
                break
        merchant = None
        merchant_match = re.search(r"\ben\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚáéíóúñ .-]+)$", message.strip())
        if merchant_match:
            merchant = re.sub(
                r"\s+(ayer|hoy|anteayer)$", "", merchant_match.group(1).strip(), flags=re.IGNORECASE
            )
        missing = []
        if amount is None:
            missing.append("amount")
        if category is None:
            missing.append("category")
        if merchant is None:
            missing.append("merchant")
        question_map = {
            "amount": "¿Cuál fue el monto del gasto?",
            "category": "¿A qué categoría corresponde el gasto?",
            "merchant": "¿En qué comercio realizaste el gasto?",
        }
        return ExpenseDraft(
            amount=amount,
            currency="USD",
            date=expense_date,
            category=category,
            merchant=merchant,
            missing_fields=missing,
            requires_clarification=bool(missing),
            clarification_question=question_map[missing[0]] if missing else None,
            source_text=message,
        )
