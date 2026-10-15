#!/bin/bash
# Script untuk balik Prisma schema dari PostgreSQL ke SQLite (untuk dev lokal)
# Jalankan setelah deploy ke Vercel: bash scripts/switch-to-sqlite.sh

set -e

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "❌ File $SCHEMA_FILE tidak ditemukan"
  exit 1
fi

echo "🔄 Switching Prisma schema kembali ke SQLite (dev lokal)..."

# Ganti provider dari postgresql ke sqlite
sed -i 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA_FILE"

# Verifikasi
if grep -q 'provider = "sqlite"' "$SCHEMA_FILE"; then
  echo "✅ Schema berhasil di-switch ke SQLite"
  echo ""
  echo "📋 Untuk dev lokal:"
  echo "   - DATABASE_URL di .env sudah pakai SQLite (file:./db/custom.db)"
  echo "   - Jalankan: bun run db:push (untuk sync schema)"
  echo "   - Jalankan: bunx tsx scripts/seed.ts (untuk seed data)"
else
  echo "❌ Gagal switch. Restore dari backup..."
  cp prisma/schema.sqlite.bak "$SCHEMA_FILE" 2>/dev/null || true
  exit 1
fi
