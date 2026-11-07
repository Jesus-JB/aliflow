#!/usr/bin/env bash
# Corre las pruebas de restricciones del entregable 04 contra una base migrada
# con Alembic. Cada una de las 10 violaciones DEBE ser rechazada por la base:
# si alguna pasa, esa regla de negocio dejó de estar protegida.
#
# Uso: scripts/probar-restricciones.sh <url psql de una base vacía>
set -euo pipefail
cd "$(dirname "$0")/.."
PSQL_URL="$1"
ESPERADAS=10
ALIFLOW_DATABASE_URL="${PSQL_URL/postgresql:/postgresql+psycopg:}" alembic upgrade head
rechazadas=$(psql "$PSQL_URL" -f ../../Entregables/markdown/04-Modelo-de-Base-de-Datos/pruebas-restricciones.sql 2>&1 | grep -c ERROR || true)
echo "Violaciones rechazadas por la base: $rechazadas de $ESPERADAS"
[ "$rechazadas" -eq "$ESPERADAS" ]
