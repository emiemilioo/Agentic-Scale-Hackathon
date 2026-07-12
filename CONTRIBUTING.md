# Guía para colaborar en Saldo Claro

Esta guía permite que cada integrante trabaje sin sobrescribir cambios de otras personas.

## 1. Obtener la versión más reciente

```bash
git switch main
git pull origin main
```

## 2. Crear una rama

Usa una rama por cambio:

```bash
git switch -c feature/nombre-del-cambio
```

Prefijos recomendados:

- `feature/`: funcionalidad nueva.
- `fix/`: corrección de errores.
- `docs/`: documentación.
- `test/`: pruebas.

No trabajes directamente en `main`.

## 3. Identificar dónde editar

- Interfaz: `frontend/src/`.
- API: `backend/`.
- Gemini y esquemas del agente: `agent/`.
- Reglas y persistencia: `services/`.
- Base aprobada: `data/`.
- Pruebas: `tests/`.

Lee primero el mapa de archivos del `README.md`.

## 4. Verificar el cambio

Backend y reglas:

```bash
conda activate saldo-claro
python -m pytest -q
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

No se debe fusionar un cambio si las pruebas o la compilación fallan.

## 5. Guardar y publicar

```bash
git status
git add ruta/de/los/archivos
git commit -m "Describe el cambio de forma breve"
git push -u origin feature/nombre-del-cambio
```

Evita `git add .` si existen archivos ajenos a tu tarea.

## 6. Crear Pull Request

En GitHub:

1. Selecciona la rama publicada.
2. Crea un Pull Request hacia `main`.
3. Explica qué cambió y cómo probarlo.
4. Solicita revisión a otro integrante.
5. Fusiona solo cuando las verificaciones estén correctas.

## Lista para revisar un Pull Request

- [ ] El cambio resuelve una sola tarea clara.
- [ ] No contiene `.env`, claves, bases de datos o `node_modules`.
- [ ] Las 16 pruebas existentes siguen aprobando.
- [ ] `npm run build` termina correctamente si se modificó el frontend.
- [ ] Se agregó una prueba cuando cambió una regla importante.
- [ ] Los textos y errores son comprensibles para el usuario.
- [ ] El README se actualizó si cambió la instalación o arquitectura.

## Reglas importantes

- Gemini interpreta; no confirma ni persiste operaciones.
- Las validaciones financieras deben vivir en Python, no solo en el prompt.
- Las acciones sensibles requieren confirmación o escalamiento humano.
- No almacenar secretos en Git.
- No cambiar simultáneamente contratos del backend y llamadas del frontend sin coordinar ambos lados.

## Si ocurre un conflicto

No borres cambios de otro integrante. Actualiza tu rama:

```bash
git switch main
git pull origin main
git switch feature/nombre-del-cambio
git merge main
```

Resuelve únicamente los archivos que comprendas, ejecuta pruebas y pide ayuda antes de fusionar si el conflicto afecta reglas financieras.
