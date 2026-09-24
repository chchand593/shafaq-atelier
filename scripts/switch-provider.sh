#!/bin/bash
# scripts/switch-provider.sh
#
# Auto-switches the Prisma provider between "sqlite" and "postgresql" based
# on the DATABASE_URL environment variable. This eliminates the need to
# manually edit prisma/schema.prisma when switching between the Z.ai preview
# (SQLite) and Vercel/Neon production (PostgreSQL).
#
# - If DATABASE_URL starts with "file:" → provider = "sqlite"
# - If DATABASE_URL starts with "postgres:" or "postgresql:" → provider = "postgresql"
# - If DATABASE_URL is not set → defaults to "postgresql" (production assumption)
#
# SAFE: Only edits the provider line inside the `datasource db` block.
# Does NOT touch any model definitions, relations, comments, or other
# schema content. Does NOT modify the database. Does NOT run any
# destructive commands.

set -e

SCHEMA_FILE="prisma/schema.prisma"
DB_URL="${DATABASE_URL:-}"

# Determine the correct provider
if [[ "$DB_URL" == file:* ]]; then
  PROVIDER="sqlite"
elif [[ "$DB_URL" == postgres:* ]] || [[ "$DB_URL" == postgresql:* ]]; then
  PROVIDER="postgresql"
else
  PROVIDER="postgresql"
fi

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "[switch-provider] schema.prisma not found, skipping"
  exit 0
fi

# Read the current provider from the datasource block
# The datasource block looks like:
#   datasource db {
#     provider = "xxx"
#     url      = env("DATABASE_URL")
#   }
# We find the line number of "datasource db" and the next "provider" line after it.
DATASOURCE_LINE=$(grep -n '^datasource db {' "$SCHEMA_FILE" | head -1 | cut -d: -f1)
if [ -z "$DATASOURCE_LINE" ]; then
  echo "[switch-provider] datasource block not found — skipping"
  exit 0
fi

# Get the provider value from the line after datasource that contains "provider = "
CURRENT_PROVIDER=$(tail -n +"$DATASOURCE_LINE" "$SCHEMA_FILE" | grep -m1 'provider = ' | sed 's/.*provider = "\([^"]*\)".*/\1/')

if [ "$CURRENT_PROVIDER" = "$PROVIDER" ]; then
  echo "[switch-provider] provider already set to '$PROVIDER' — no change needed"
  exit 0
fi

echo "[switch-provider] switching provider from '$CURRENT_PROVIDER' to '$PROVIDER' (DATABASE_URL=${DB_URL:0:20}...)"

# Find the exact line number of the provider line within the datasource block
PROVIDER_LINE=$(tail -n +"$DATASOURCE_LINE" "$SCHEMA_FILE" | grep -n 'provider = ' | head -1 | cut -d: -f1)
ACTUAL_LINE=$((DATASOURCE_LINE + PROVIDER_LINE - 1))

# Replace only that specific line
sed -i "${ACTUAL_LINE}s/provider = \"[^\"]*\"/provider = \"$PROVIDER\"/" "$SCHEMA_FILE"

# Verify
NEW_PROVIDER=$(tail -n +"$DATASOURCE_LINE" "$SCHEMA_FILE" | grep -m1 'provider = ' | sed 's/.*provider = "\([^"]*\)".*/\1/')
if [ "$NEW_PROVIDER" != "$PROVIDER" ]; then
  echo "[switch-provider] ERROR: failed to switch. Expected '$PROVIDER', got '$NEW_PROVIDER'"
  exit 1
fi

echo "[switch-provider] provider is now '$PROVIDER'"
