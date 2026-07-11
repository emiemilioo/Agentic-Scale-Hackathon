# Saldo Claro - primer MVP

Primera versión del agente financiero para el Track 2. Usa React para la interfaz y FastAPI/Python para interpretar gastos, validarlos, solicitar confirmación y guardarlos en SQLite.

## 1. Crear el entorno con Anaconda

Abre **Anaconda Prompt**, entra a esta carpeta y ejecuta:

```bash
conda env create -f environment.yml
conda activate saldo-claro
```

Si el entorno ya existe:

```bash
conda env update -f environment.yml --prune
conda activate saldo-claro
```

## 2. Configurar Gemini

Copia `.env.example` como `.env` y agrega tu clave:

```text
GEMINI_API_KEY=tu_clave
GEMINI_MODEL=gemini-3.5-flash
```

Mientras no exista una clave, la aplicación funciona en **modo demo local** con respuestas previsibles. La interfaz siempre indica qué modo está activo.

No subas `.env` ni la clave al repositorio.

## 3. Ejecutar el backend

```bash
uvicorn backend.main:app --reload
```

La API queda disponible en `http://127.0.0.1:8000` y su documentación automática en `http://127.0.0.1:8000/docs`.

## 4. Ejecutar el frontend

En una segunda terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`.

Prueba estos mensajes:

```text
Gasté 25 dólares en comida ayer en Mi Comisariato
Pagué 18 en La Esquina ayer
```

El primer mensaje debe quedar listo para confirmación. En el segundo debe faltar la categoría.

## 5. Ejecutar pruebas

```bash
python -m pytest -q
```

## Qué hace cada parte

- `frontend/`: interfaz React creada con Vite.
- `backend/main.py`: endpoints FastAPI y control de las acciones.
- `agent/schemas.py`: contrato de datos que debe respetar Gemini.
- `agent/gemini_client.py`: comunicación con Gemini o modo demo.
- `services/validation.py`: reglas que no se delegan al modelo.
- `services/transactions.py`: persistencia en SQLite y resumen financiero.
- `tests/`: pruebas reproducibles sin consumir la API.

## Decisión arquitectónica

Gemini interpreta lenguaje natural, pero no escribe en la base de datos. React solo presenta información y solicita acciones. FastAPI recibe esas acciones, Pydantic valida los contratos y Python aplica las reglas financieras. Solo después de que el usuario confirma, el servicio de transacciones registra el movimiento.

## Casos cubiertos por las pruebas

- Extracción completa en modo local controlado.
- Detección de categoría faltante.
- Rechazo de montos no positivos y fechas futuras.
- Contrato de confirmación de operaciones.
- Presupuesto debajo, encima del umbral y excedido.
- Respuesta informativa con fuente aprobada.
- Escalamiento de operación no reconocida.
- Abstención cuando la base aprobada no contiene una respuesta.

Las pruebas no consumen la API de Gemini y no requieren una clave.

## Variables para despliegue

Backend:

```text
GEMINI_API_KEY=secreto configurado en el proveedor
GEMINI_MODEL=gemini-3.5-flash
CORS_ORIGINS=https://tu-frontend.vercel.app
```

Frontend:

```text
VITE_API_URL=https://tu-backend.onrender.com
```

SQLite se utiliza únicamente para la demostración. En producción se migraría a PostgreSQL.
