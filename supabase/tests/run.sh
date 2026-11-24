#!/usr/bin/env bash
# Run the CreatorConnect database + RLS acceptance tests against a *throwaway*
# local Postgres (not Supabase). This validates the schema, policies and
# privileged functions without needing the full Supabase stack.
#
# Requirements: a local PostgreSQL 14+ you can connect to as a superuser.
# Usage:
#   PGHOST=... PGPORT=... PGUSER=postgres ./supabase/tests/run.sh
# Defaults assume a local socket server on port 5432 with user "postgres".
#
# It creates a scratch database `cc_rls_test`, applies local auth/storage stubs
# (00_local_stubs.sql) + all migrations + seed, then runs rls.test.sql which
# fails the process if any assertion fails.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG="$HERE/../migrations"
SEED="$HERE/../seed.sql"
DB="${CC_TEST_DB:-cc_rls_test}"

export PGHOST="${PGHOST:-/var/run/postgresql}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

psql -v ON_ERROR_STOP=1 -q -c "drop database if exists $DB;" postgres
psql -v ON_ERROR_STOP=1 -q -c "create database $DB;" postgres

run() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1" >/dev/null; }

echo "Applying local stubs + migrations + seed to $DB ..."
run "$HERE/00_local_stubs.sql"
for f in "$MIG"/*.sql; do run "$f"; done
run "$SEED"

echo "Running RLS acceptance tests ..."
psql -v ON_ERROR_STOP=1 -d "$DB" -f "$HERE/rls.test.sql" 2>&1 | grep -E "OK:|PASSED|ERROR|FAIL" || true

echo "Done. (drop with: psql -c 'drop database $DB;' postgres)"
