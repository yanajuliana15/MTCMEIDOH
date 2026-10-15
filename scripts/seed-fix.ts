// scripts/seed-fix.ts — VERSI FINAL (CJS compatible)
// Set DATABASE_URL SEBELUM require db, jadi PrismaClient dibuat dengan benar

const NEON_URL = 'postgresql://neondb_owner:npg_y7Ipw5nFeRCB@ep-calm-meadow-b3nngtqu-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = NEON_URL
  console.log('✅ DATABASE_URL set dari NEON_URL constant')
} else {
  console.log('✅ DATABASE_URL sudah ada di environment')
}

console.log('')
console.log('═══════════════════════════════════════')
console.log('  DEBUG INFO')
console.log('═══════════════════════════════════════')
const dbUrlBefore = process.env.DATABASE_URL
console.log('DATABASE_URL is set :', !!dbUrlBefore)
console.log('DATABASE_URL length :', dbUrlBefore?.length || 0)
if (dbUrlBefore) {
  const masked = dbUrlBefore.replace(/(postgresql:\/\/[^:]+:)([^@]+)(@)/, '$1****$3')
  console.log('DATABASE_URL (masked):', masked)
  console.log('Contains neon.tech   :', dbUrlBefore.includes('neon.tech'))
  console.log('Contains -pooler     :', dbUrlBefore.includes('-pooler'))
  console.log('Contains sslmode     :', dbUrlBefore.includes('sslmode'))
}
console.log('')

async function main() {
  console.log('📦 Loading Prisma (require)...')
  const dbModule = require('../src/lib/db')
  const db = dbModule.db
  console.log('✅ PrismaClient loaded')
  console.log('')
  console.log('🌱 Mulai seeding database Neon...\n')

  console.log('🧹 Bersihkan data lama...')
  await db.transaksiStok.deleteMany()
  await db.mesinSparepart.deleteMany()
  await db.sparepart.deleteMany()
  await db.mesin.deleteMany()
  await db.supplier.deleteMany()
  await db.kategori.deleteMany()
  await db.user.deleteMany()
  console.log('✅ Data lama dibersihkan\n')

  console.log('👥 Membuat users...')
  await db.user.create({ data: { nama: 'Super Administrator', username: 'superadmin', password: 'super123', role: 'SUPERADMIN' } })
  await db.user.create({ data: { nama: 'Administrator', username: 'admin', password: 'admin123', role: 'ADMIN' } })
  await db.user.create({ data: { nama: 'Operator Produksi', username: 'operator', password: 'operator123', role: 'OPERATOR' } })
  await db.user.create({ data: { nama: 'Staff Gudang', username: 'gudang', password: 'gudang123', role: 'GUDANG' } })
  console.log('✅ 4 users dibuat\n')

  console.log('📦 Membuat kategori...')
  const kBearing = await db.kategori.create({ data: { nama: 'Bearing', deskripsi: 'Bantalan bola, roller, dan jenis bearing lainnya' } })
  const kFilter = await db.kategori.create({ data: { nama: 'Filter', deskripsi: 'Filter oli, udara, bahan bakar, hidrolik' } })
  const kMotor = await db.kategori.create({ data: { nama: 'Motor & Drive', deskripsi: 'Motor listrik, gearbox, coupling, V-belt' } })
  const kHidrolik = await db.kategori.create({ data: { nama: 'Hidrolik & Pneumatik', deskripsi: 'Pompa hidrolik, silinder, valve, selang' } })
  const kElektrik = await db.kategori.create({ data: { nama: 'Elektrik', deskripsi: 'Kontaktor, relay, sensor, MCB' } })
  const kSegel = await db.kategori.create({ data: { nama: 'Seal & Gasket', deskripsi: 'Oil seal, O-ring, gasket kepala silinder' } })
  console.log('✅ 6 kategori dibuat\n')

  console.log('🚚 Membuat supplier...')
  const sup1 = await db.supplier.create({ data: { nama: 'PT. Berkat Teknik Industri', kontak: 'Budi Santoso', telepon: '021-5551234', email: 'sales@berkatteknik.co.id', alamat: 'Jl. Industri Raya No. 12, Pulogadung, Jakarta Timur' } })
  const sup2 = await db.supplier.create({ data: { nama: 'CV. Maju Jaya Sparepart', kontak: 'Siti Aminah', telepon: '031-7788990', email: 'info@majujaya-sparepart.com', alamat: 'Jl. Rungkut Industri Blok C-15, Surabaya' } })
  const sup3 = await db.supplier.create({ data: { nama: 'PT. SKF Indonesia', kontak: 'Hendra Wijaya', telepon: '021-6543210', email: 'order@skf-indonesia.co.id', alamat: 'Jl. Jalur Sutera Barat Kav. 25, Alam Sutera, Tangerang' } })
  const sup4 = await db.supplier.create({ data: { nama: 'PT. Schneider Electric Indonesia', kontak: 'Linda Kusuma', telepon: '021-29229999', email: 'customer.care@schneider-id.com', alamat: 'World Trade Centre 3, Jl. Jend. Sudirman Kav. 29-31, Jakarta' } })
  console.log('✅ 4 supplier dibuat\n')

  console.log('⚙️ Membuat mesin...')
  const m1 = await db.mesin.create({ data: { kode: 'MCH-001', nama: 'Pompa Sentrifugal 1A', lokasi: 'Pabrik A - Pump Station', manufaktur: 'Grundfos', tahunInstal: 2019, status: 'Aktif' } })
  const m2 = await db.mesin.create({ data: { kode: 'MCH-002', nama: 'Kompressor Udara 75kW', lokasi: 'Pabrik A - Compressor Room', manufaktur: 'Atlas Copco', tahunInstal: 2020, status: 'Aktif' } })
  const m3 = await db.mesin.create({ data: { kode: 'MCH-003', nama: 'Motor Konveyor Lini 2', lokasi: 'Pabrik B - Lini Produksi', manufaktur: 'Siemens', tahunInstal: 2021, status: 'Maintenance' } })
  const m4 = await db.mesin.create({ data: { kode: 'MCH-004', nama: 'Press Hidrolik 200 Ton', lokasi: 'Pabrik B - Press Area', manufaktur: 'Schuler', tahunInstal: 2018, status: 'Aktif' } })
  const m5 = await db.mesin.create({ data: { kode: 'MCH-005', nama: 'Boiler 5 Ton/uap', lokasi: 'Utility - Boiler House', manufaktur: 'Miura', tahunInstal: 2017, status: 'Berhenti' } })
  console.log('✅ 5 mesin dibuat\n')

  console.log('🔩 Membuat sparepart...')
  const sp1 = await db.sparepart.create({ data: { kode: 'SP-BRG-6205', nama: 'Bearing 6205 ZZ', kategoriId: kBearing.id, supplierId: sup3.id, satuan: 'pcs', stok: 50, stokMinimum: 20, hargaBeli: 85000, hargaJual: 110000, lokasiRak: 'A1-03', catatan: 'Bearing motor 5.5 kW' } })
  const sp2 = await db.sparepart.create({ data: { kode: 'SP-BRG-6308', nama: 'Bearing 6308-2RS', kategoriId: kBearing.id, supplierId: sup3.id, satuan: 'pcs', stok: 8, stokMinimum: 15, hargaBeli: 175000, hargaJual: 230000, lokasiRak: 'A1-04', catatan: 'STOK MENIPIS - pompa sentrifugal' } })
  const sp3 = await db.sparepart.create({ data: { kode: 'SP-FLT-OLI-OC25', nama: 'Filter Oli OC25', kategoriId: kFilter.id, supplierId: sup2.id, satuan: 'pcs', stok: 30, stokMinimum: 10, hargaBeli: 45000, hargaJual: 62000, lokasiRak: 'B2-01' } })
  const sp4 = await db.sparepart.create({ data: { kode: 'SP-FLT-UDARA-A2924', nama: 'Filter Udara A2924', kategoriId: kFilter.id, supplierId: sup2.id, satuan: 'pcs', stok: 4, stokMinimum: 6, hargaBeli: 285000, hargaJual: 380000, lokasiRak: 'B2-05', catatan: 'KHUSUS KOMPRESSOR ATLAS COPCO' } })
  const sp5 = await db.sparepart.create({ data: { kode: 'SP-MTR-5.5KW', nama: 'Motor Listrik 3 Phase 5.5 kW', kategoriId: kMotor.id, supplierId: sup1.id, satuan: 'unit', stok: 2, stokMinimum: 3, hargaBeli: 4250000, hargaJual: 5100000, lokasiRak: 'Palet 5' } })
  const sp6 = await db.sparepart.create({ data: { kode: 'SP-MTR-VBELT-B65', nama: 'V-Belt B65', kategoriId: kMotor.id, supplierId: sup1.id, satuan: 'pcs', stok: 25, stokMinimum: 10, hargaBeli: 95000, hargaJual: 130000, lokasiRak: 'C3-02' } })
  const sp7 = await db.sparepart.create({ data: { kode: 'SP-HYD-POMPA-G15', nama: 'Pompa Hidrolik Gear G15', kategoriId: kHidrolik.id, supplierId: sup1.id, satuan: 'unit', stok: 1, stokMinimum: 2, hargaBeli: 12500000, hargaJual: 15000000, lokasiRak: 'Palet 7', catatan: 'CRITICAL - press hidrolik' } })
  const sp8 = await db.sparepart.create({ data: { kode: 'SP-HYD-SILND-100', nama: 'Silinder Hidrolik 100x500mm', kategoriId: kHidrolik.id, supplierId: sup2.id, satuan: 'unit', stok: 3, stokMinimum: 2, hargaBeli: 4500000, hargaJual: 5500000, lokasiRak: 'Palet 8' } })
  const sp9 = await db.sparepart.create({ data: { kode: 'SP-ELK-KONT-LC1D25', nama: 'Kontaktor LC1D25', kategoriId: kElektrik.id, supplierId: sup4.id, satuan: 'pcs', stok: 12, stokMinimum: 5, hargaBeli: 685000, hargaJual: 850000, lokasiRak: 'D1-03' } })
  const sp10 = await db.sparepart.create({ data: { kode: 'SP-ELK-RELAY-RXM', nama: 'Relay RXM 4 CO 24VDC', kategoriId: kElektrik.id, supplierId: sup4.id, satuan: 'pcs', stok: 0, stokMinimum: 10, hargaBeli: 145000, hargaJual: 195000, lokasiRak: 'D1-08', catatan: 'STOK HABIS - segera PO' } })
  const sp11 = await db.sparepart.create({ data: { kode: 'SP-SL-OILSEAL-100', nama: 'Oil Seal TC 100x125x12', kategoriId: kSegel.id, supplierId: sup3.id, satuan: 'pcs', stok: 15, stokMinimum: 8, hargaBeli: 35000, hargaJual: 55000, lokasiRak: 'E2-04' } })
  const sp12 = await db.sparepart.create({ data: { kode: 'SP-SL-ORING-120', nama: 'O-Ring 120mm Viton', kategoriId: kSegel.id, supplierId: sup3.id, satuan: 'pcs', stok: 40, stokMinimum: 15, hargaBeli: 18000, hargaJual: 32000, lokasiRak: 'E2-09' } })
  const sp13 = await db.sparepart.create({ data: { kode: 'SP-BRG-22220', nama: 'Bearing Roller 22220 E', kategoriId: kBearing.id, supplierId: sup3.id, satuan: 'pcs', stok: 5, stokMinimum: 4, hargaBeli: 1850000, hargaJual: 2350000, lokasiRak: 'A2-01' } })
  const sp14 = await db.sparepart.create({ data: { kode: 'SP-HYD-HOSE-3/4', nama: 'Selang Hidrolik 3/4 inch', kategoriId: kHidrolik.id, supplierId: sup2.id, satuan: 'meter', stok: 60, stokMinimum: 30, hargaBeli: 85000, hargaJual: 120000, lokasiRak: 'F1-02' } })
  const sp15 = await db.sparepart.create({ data: { kode: 'SP-ELK-SENSOR-PROX', nama: 'Sensor Proximity PNP NO M12', kategoriId: kElektrik.id, supplierId: sup4.id, satuan: 'pcs', stok: 18, stokMinimum: 6, hargaBeli: 285000, hargaJual: 395000, lokasiRak: 'D2-05' } })
  console.log('✅ 15 sparepart dibuat\n')

  console.log('🔗 Membuat relasi mesin-sparepart...')
  await db.mesinSparepart.createMany({ data: [
    { mesinId: m1.id, sparepartId: sp1.id }, { mesinId: m1.id, sparepartId: sp11.id }, { mesinId: m1.id, sparepartId: sp13.id },
    { mesinId: m2.id, sparepartId: sp1.id }, { mesinId: m2.id, sparepartId: sp4.id }, { mesinId: m2.id, sparepartId: sp11.id }, { mesinId: m2.id, sparepartId: sp3.id },
    { mesinId: m3.id, sparepartId: sp5.id }, { mesinId: m3.id, sparepartId: sp6.id }, { mesinId: m3.id, sparepartId: sp9.id }, { mesinId: m3.id, sparepartId: sp10.id },
    { mesinId: m4.id, sparepartId: sp7.id }, { mesinId: m4.id, sparepartId: sp8.id }, { mesinId: m4.id, sparepartId: sp14.id }, { mesinId: m4.id, sparepartId: sp12.id },
    { mesinId: m5.id, sparepartId: sp3.id }, { mesinId: m5.id, sparepartId: sp4.id }, { mesinId: m5.id, sparepartId: sp11.id }, { mesinId: m5.id, sparepartId: sp13.id },
  ]})
  console.log('✅ 20 relasi dibuat\n')

  console.log('💰 Membuat transaksi stok...')
  const gudangUser = await db.user.findUnique({ where: { username: 'gudang' } })
  const operatorUser = await db.user.findUnique({ where: { username: 'operator' } })
  await db.transaksiStok.createMany({ data: [
    { sparepartId: sp1.id, tipe: 'MASUK', jumlah: 50, referensi: 'PO-2024-001', catatan: 'Pembelian awal', userId: gudangUser?.id },
    { sparepartId: sp2.id, tipe: 'KELUAR', jumlah: 7, referensi: 'WO-2024-001', catatan: 'Pemakaian service pompa', userId: operatorUser?.id },
    { sparepartId: sp3.id, tipe: 'MASUK', jumlah: 30, referensi: 'PO-2024-002', userId: gudangUser?.id },
    { sparepartId: sp4.id, tipe: 'KELUAR', jumlah: 2, referensi: 'WO-2024-002', catatan: 'Ganti filter kompressor', userId: operatorUser?.id },
    { sparepartId: sp10.id, tipe: 'KELUAR', jumlah: 10, referensi: 'WO-2024-003', catatan: 'Restock lini 2', userId: operatorUser?.id },
  ]})
  console.log('✅ 5 transaksi dibuat\n')

  console.log('═══════════════════════════════════════')
  console.log('  🎉 SEED BERHASIL!')
  console.log('═══════════════════════════════════════')
  console.log('')
  console.log('Sekarang test login di:')
  console.log('  https://mtcmeidoh.vercel.app/')
  console.log('  Username: superadmin')
  console.log('  Password: super123')

  return db
}

main()
  .then(async (db: any) => {
    if (db) {
      try { await db.$disconnect() } catch {}
    }
    process.exit(0)
  })
  .catch((e: any) => {
    console.error('')
    console.error('═══════════════════════════════════════')
    console.error('  ❌ ERROR saat seeding')
    console.error('═══════════════════════════════════════')
    console.error('')
    console.error('Pesan error:', e.message)
    console.error('')
    console.error('Stack trace:', e.stack)
    console.error('')
    console.error('Kemungkinan penyebab:')
    console.error('  1. Connection string salah / tidak lengkap')
    console.error('  2. Password salah di URL')
    console.error('  3. Tabel belum di-push ke Neon (jalankan: npx prisma db push --accept-data-loss)')
    console.error('  4. Neon database suspend (free tier idle)')
    process.exit(1)
  })