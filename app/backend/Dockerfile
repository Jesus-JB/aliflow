FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY aliflow ./aliflow
RUN pip install --no-cache-dir .
COPY alembic.ini ./
COPY migrations ./migrations
# Las migraciones corren antes de levantar la API: el esquema siempre está al día.
CMD ["sh", "-c", "alembic upgrade head && uvicorn aliflow.main:app --host 0.0.0.0 --port 8000"]
