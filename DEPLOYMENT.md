# Panduan Deploy ke Vercel + Neon Database

Panduan langkah demi langkah untuk deploy aplikasi MTC MEIDOH ke Vercel dengan database Neon (PostgreSQL serverless).

---

## Prasyarat

1. **Akun Vercel** — daftar di https://vercel.com (gratis, pakai GitHub/Google)
2. **Akun Neon** — daftar di https://neon.tech (free tier: 0.5 GB storage, 100 jam compute/bulan)
3. **Git repository** — kode sudah di-push ke GitHub/GitLab/Bitbucket

---

## Langkah 1: Buat Database di Neon

1. Login ke https://console.neon.tech
2. Klik **"New Project"** → isi:
   - **Project name**: `mtc-meidoh`
   - **Database name**: `mtc_meidoh`
   - **Region**: pilih yang terdekat dengan user (misal `Singapore` untuk Indonesia)
   - **Postgres version**: biarkan default (16)
3. Klik **"Create project"**
4. Setelah project dibuat, Neon akan menampilkan connection string. **Salin yang "Pooled connection"** (ada `-pooler` di hostname):
   ```
   postgresql://neondb_owner:xxx@ep-mtc-meidoh-pooler-southeast-1.aws.neon.tech/mtc_meidoh?sslmode=require
   ```
   Simpan connection string ini — akan dipakai di Langkah 3.

---

## Langkah 2: Push Kode ke Git Repository

```bash
# Kalau belum ada git repo, init dulu
git init
git add .
git commit -m "Setup untuk Vercel + Neon"

# Push ke GitHub (ganti dengan repo URL Anda)
git remote add origin https://github.com/USERNAME/mtc-meidoh.git
git branch -M main
git push -u origin main
```

---

## Langkah 3: Import Project ke Vercel

1. Login ke https://vercel.com
2. Klik **"Add New..."** → **"Project"**
3. Pilih repository Git Anda → klik **"Import"**
4. Di halaman **"Configure Project"**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `bun run db:generate && next build` (sudah di vercel.json)
   - **Install Command**: `bun install` (sudah di vercel.json)
5. **Scroll ke bawah ke "Environment Variables"** → klik **"Add"**:
   - **Key**: `DATABASE_URL`
   - **Value**: paste connection string Neon dari Langkah 1 (yang **Pooled**, ada `-pooler`)
   - **Environments**: centang semua (Production, Preview, Development)
6. Klik **"Deploy"**

Vercel akan mulai build. Tunggu 2-5 menit sampai status **"Ready"**.

---

## Langkah 4: Setup Database Schema di Neon

Setelah deploy pertama berhasil, kita perlu push schema Prisma ke database Neon.

### Opsi A: Setup otomatis via Vercel (Recommended)

1. Di dashboard Vercel project Anda → tab **"Settings"** → **"Functions"**
2. Scroll ke bawah, cari **"Build Command"** dan edit menjadi:
   ```
   bun run db:generate && bun run db:push && next build
   ```
3. Trigger redeploy: tab **"Deployments"** → klik tombol `...` di deployment terbaru → **"Redeploy"**

Build akan menjalankan `prisma db push` yang otomatis buat semua tabel di Neon.

### Opsi B: Setup manual via terminal lokal

```bash
# Set DATABASE_URL ke Neon (sementara di .env lokal)
export DATABASE_URL="postgresql://neondb_owner:xxx@ep-mtc-meidoh-pooler-southeast-1.aws.neon.tech/mtc_meidoh?sslmode=require"

# Push schema ke Neon
bun run db:push

# (Opsional) Seed data awal
bunx tsx scripts/seed.ts
```

---

## Langkah 5: Seed Data Awal (Penting!)

Database Neon baru kosong. Anda perlu seed data awal (users, kategori, supplier, mesin, sparepart, transaksi).

### Cara 1: Seed via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project lokal ke Vercel
vercel link

# Pull environment variables dari Vercel
vercel env pull .env.local

# Sekarang .env.local punya DATABASE_URL Neon
# Jalankan seed
bunx tsx scripts/seed.ts
```

### Cara 2: Buat API endpoint seed sementara

Buat file `src/app/api/seed/route.ts`:
```typescript
import { NextResponse } from 'next/server'
// ... copy isi dari scripts/seed.ts
// Hapus setelah selesai seed!
```

Lalu akses URL: `https://APP-ANDA.vercel.app/api/seed`

**⚠️ HAPUS endpoint ini setelah seed berhasil** agar tidak bisa diakses publik.

---

## Langkah 6: Verifikasi Deployment

1. Buka URL Vercel Anda (misal: `https://mtc-meidoh.vercel.app`)
2. Login dengan akun default:
   - **Superadmin**: `superadmin` / `super123`
   - **Admin**: `admin` / `admin123`
   - **Gudang**: `gudang` / `gudang123`
   - **Operator**: `operator` / `operator123`
3. Test fitur:
   - Dashboard menampilkan data
   - Tambah sparepart baru
   - Export CSV
   - Manajemen User (khusus superadmin)

---

## Troubleshooting

### Error: "Prisma Client tidak bisa connect ke database"

**Penyebab**: Connection string salah, atau pakai yang Direct (bukan Pooled).

**Solusi**:
1. Cek connection string di Neon dashboard → pakai yang **Pooled** (ada `-pooler`)
2. Pastikan ada `?sslmode=require` di akhir URL
3. Restart Vercel deployment

### Error: "Database tidak memiliki tabel"

**Solusi**: Jalankan `bun run db:push` dengan DATABASE_URL Neon (lihat Langkah 4).

### Build error: "Cannot find module @neondatabase/serverless"

**Solusi**: Pastikan dependencies ter-install. Vercel seharusnya otomatis install dari `package.json`. Kalau gagal:
```bash
# Di lokal, pastikan package tersimpan
bun add @neondatabase/serverless @prisma/adapter-neon
git add package.json
git commit -m "Add Neon dependencies"
git push
```

### Login tidak work di production (cookie hilang)

**Penyebab**: Cookie `secure: true` di production, tapi Anda akses via HTTP (bukan HTTPS).

**Solusi**: Vercel default pakai HTTPS, jadi seharusnya tidak masalah. Kalau masih, cek:
- URL pakai `https://` (bukan `http://`)
- Browser accept cookies dari domain Vercel

### Lambat di cold start

Neon serverless punya "cold start" — database sleep kalau idle. Request pertama setelah idle lama bisa lambat 2-3 detik.

**Solusi**:
1. Upgrade Neon ke **Pro plan** ($19/bulan) untuk always-on
2. Atau pakai Vercel Cron untuk ping database tiap 5 menit

---

## Environment Variables Reference

| Variable | Value | Wajib |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...neon.tech/db?sslmode=require` (Pooled) | ✅ Ya |

Hanya 1 env var yang diperlukan. Tidak ada `NEXTAUTH_SECRET` dll karena auth pakai cookie sederhana.

---

## Backup & Maintenance

### Backup database Neon
1. Neon dashboard → project Anda → tab **"Backups"**
2. Klik **"Create backup"** — simpan point-in-time snapshot

### Restore database
1. Neon dashboard → tab **"Backups"** → pilih backup → **"Restore"**

### Reset database (HATI-HATI!)
```bash
# Hapus semua data, jalankan ulang schema + seed
vercel env pull .env.local
export DATABASE_URL="..." # dari .env.local
bunx prisma migrate reset --force
bunx tsx scripts/seed.ts
```

---

## Cost Estimation

### Vercel (Free Hobby Plan)
- 100 GB bandwidth/bulan
- 100 GB-hours serverless function execution
- Cukup untuk aplikasi internal/small team

### Neon (Free Tier)
- 0.5 GB storage
- 100 jam compute/bulan
- 1 project
- Cukup untuk data demo + production kecil

**Total: $0/bulan** untuk aplikasi kecil.

Kalau perlu lebih:
- **Vercel Pro**: $20/bulan (1 TB bandwidth, no commercial limit)
- **Neon Pro**: $19/bulan (10 GB storage, always-on, no cold start)

---

## Quick Reference

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Dashboard**: https://console.neon.tech
- **Vercel CLI**: `npm i -g vercel` → `vercel login` → `vercel link` → `vercel env pull`
- **Prisma Studio** (lihat/edit data): `bunx prisma studio` (jalankan lokal dengan DATABASE_URL Neon)

Selamat deploy! 🚀
