#!/bin/bash
# Script untuk switch Prisma schema dari SQLite ke PostgreSQL (Neon)
# Jalankan sebelum deploy ke Vercel: bash scripts/switch-to-postgres.sh
# Setelah deploy, untuk balik ke SQLite dev: bash scripts/switch-to-sqlite.sh

set -e

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "❌ File $SCHEMA_FILE tidak ditemukan"
  exit 1
fi

echo "🔄 Switching Prisma schema ke PostgreSQL (Neon)..."

# Backup schema SQLite
cp "$SCHEMA_FILE" prisma/schema.sqlite.bak
echo "✅ Backup schema SQLite ke prisma/schema.sqlite.bak"

# Ganti provider dari sqlite ke postgresql
sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA_FILE"

# Verifikasi
if grep -q 'provider = "postgresql"' "$SCHEMA_FILE"; then
  echo "✅ Schema berhasil di-switch ke PostgreSQL"
  echo ""
  echo "📋 Langkah selanjutnya untuk deploy ke Vercel:"
  echo "   1. Push kode ke Git repository"
  echo "   2. Import project ke Vercel (https://vercel.com/new)"
  echo "   3. Set Environment Variable di Vercel:"
  echo "      DATABASE_URL = postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require"
  echo "      (pakai connection string POOLED dari Neon dashboard)"
  echo "   4. Deploy — Vercel akan auto-run 'prisma generate' (postinstall) + 'next build'"
  echo "   5. Setelah deploy, push schema ke Neon:"
  echo "      DATABASE_URL='your-neon-url' bun run db:push"
  echo "   6. Seed data awal via API: POST /api/seed dengan header 'x-seed-confirm: RESET'"
  echo ""
  echo "📖 Lihat DEPLOYMENT.md untuk panduan lengkap"
else
  echo "❌ Gagal switch. Restore backup..."
  cp prisma/schema.sqlite.bak "$SCHEMA_FILE"
  exit 1
fi
