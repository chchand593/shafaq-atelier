#!/bin/bash
# Vercel build script — runs prisma db push (creates tables) + generate + next build
# This file is automatically used by Vercel if it exists.
# On Vercel, DATABASE_URL will be the Neon PostgreSQL URL — so db push will work.

set -e

echo "=== Running prisma db push ==="
npx prisma db push --accept-data-loss

echo "=== Running prisma generate ==="
npx prisma generate

echo "=== Running next build ==="
npx next build

echo "=== Copying static files ==="
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

echo "=== Build complete ==="
