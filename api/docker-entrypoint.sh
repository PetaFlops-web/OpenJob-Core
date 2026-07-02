#!/bin/sh
set -e

echo "==> Open-Job API Entrypoint <=="

if [ "${RUN_MIGRATIONS}" = "true" ] || [ "${RUN_MIGRATIONS}" = "auto" ]; then
  echo "==> Running database migrations..."
  npx node-pg-migrate up
fi

echo "==> Starting API server..."
exec "$@"
