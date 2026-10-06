import { db } from '../src/lib/db'

async function main() {
  // Bersihkan data lama
  await db.transaksiStok.deleteMany()
  await db.mesinSparepart.deleteMany()
  await db.sparepart.deleteMany()
  await db.mesin.deleteMany()
  await db.kategori.deleteMany()
  await db.user.deleteMany()

  // === USERS (3 ROLE) ===
  await db.user.create({
    data: { nama: 'Administrator', username: 'admin', password: 'admin123', role: 'ADMIN' },
  })
  await db.user.create({
    data: { nama: 'Operator Produksi', username: 'operator', password: 'operator123', role: 'OPERATOR' },
  })
  await db.user.create({
    data: { nama: 'Staff Gudang', username: 'gudang', password: 'gudang123', role: 'GUDANG' },
  })

  // === KATEGORI ===
  const kategoriBearing = await db.kategori.create({
    data: { nama: 'Bearing', deskripsi: 'Bantalan bola, roller, dan jenis bearing lainnya' },
  })
  const kategoriFilter = await db.kategori.create({
    data: { nama: 'Filter', deskripsi: 'Filter oli, udara, bahan bakar, hidrolik' },
  })
  const kategoriMotor = await db.kategori.create({
    data: { nama: 'Motor & Drive', deskripsi: 'Motor listrik, gearbox, coupling, V-belt' },
  })
  const kategoriHidrolik = await db.kategori.create({
    data: { nama: 'Hidrolik & Pneumatik', deskripsi: 'Pompa hidrolik, silinder, valve, selang' },
  })
  const kategoriElektrik = await db.kategori.create({
    data: { nama: 'Elektrik', deskripsi: 'Kontaktor, relay, sensor, MCB' },
  })
  const kategoriSegel = await db.kategori.create({
    data: { nama: 'Seal & Gasket', deskripsi: 'Oil seal, O-ring, gasket kepala silinder' },
  })

  // === MESIN ===
  const mesin1 = await db.mesin.create({
    data: {
      kode: 'MCH-001', nama: 'Pompa Sentrifugal 1A',
      lokasi: 'Pabrik A - Pump Station', manufaktur: 'Grundfos', tahunInstal: 2019, status: 'Aktif',
    },
  })
  const mesin2 = await db.mesin.create({
    data: {
      kode: 'MCH-002', nama: 'Kompressor Udara 75kW',
      lokasi: 'Pabrik A - Compressor Room', manufaktur: 'Atlas Copco', tahunInstal: 2020, status: 'Aktif',
    },
  })
  const mesin3 = await db.mesin.create({
    data: {
      kode: 'MCH-003', nama: 'Motor Konveyor Lini 2',
      lokasi: 'Pabrik B - Lini Produksi', manufaktur: 'Siemens', tahunInstal: 2021, status: 'Maintenance',
    },
  })
  const mesin4 = await db.mesin.create({
    data: {
      kode: 'MCH-004', nama: 'Press Hidrolik 200 Ton',
      lokasi: 'Pabrik B - Press Area', manufaktur: 'Schuler', tahunInstal: 2018, status: 'Aktif',
    },
  })
  const mesin5 = await db.mesin.create({
    data: {
      kode: 'MCH-005', nama: 'Boiler 5 Ton/uap',
      lokasi: 'Utility - Boiler House', manufaktur: 'Miura', tahunInstal: 2017, status: 'Berhenti',
    },
  })

  // === SPAREPART (tanpa supplier) ===
  const sp1 = await db.sparepart.create({
    data: {
      kode: 'SP-BRG-6205', nama: 'Bearing 6205 ZZ',
      kategoriId: kategoriBearing.id, satuan: 'pcs',
      stok: 50, stokMinimum: 20, hargaBeli: 85000, hargaJual: 110000,
      lokasiRak: 'A1-03', catatan: 'Bearing motor listrik 5.5 kW',
    },
  })
  const sp2 = await db.sparepart.create({
    data: {
      kode: 'SP-BRG-6308', nama: 'Bearing 6308-2RS',
      kategoriId: kategoriBearing.id, satuan: 'pcs',
      stok: 8, stokMinimum: 15, hargaBeli: 175000, hargaJual: 230000,
      lokasiRak: 'A1-04', catatan: 'STOK MENIPIS - pompa sentrifugal',
    },
  })
  const sp3 = await db.sparepart.create({
    data: {
      kode: 'SP-FLT-OLI-OC25', nama: 'Filter Oli OC25',
      kategoriId: kategoriFilter.id, satuan: 'pcs',
      stok: 30, stokMinimum: 10, hargaBeli: 45000, hargaJual: 62000,
      lokasiRak: 'B2-01',
    },
  })
  const sp4 = await db.sparepart.create({
    data: {
      kode: 'SP-FLT-UDARA-A2924', nama: 'Filter Udara A2924',
      kategoriId: kategoriFilter.id, satuan: 'pcs',
      stok: 4, stokMinimum: 6, hargaBeli: 285000, hargaJual: 380000,
      lokasiRak: 'B2-05', catatan: 'KHUSUS KOMPRESSOR ATLAS COPCO',
    },
  })
  const sp5 = await db.sparepart.create({
    data: {
      kode: 'SP-MTR-5.5KW', nama: 'Motor Listrik 3 Phase 5.5 kW',
      kategoriId: kategoriMotor.id, satuan: 'unit',
      stok: 2, stokMinimum: 3, hargaBeli: 4250000, hargaJual: 5100000,
      lokasiRak: 'Palet 5',
    },
  })
  const sp6 = await db.sparepart.create({
    data: {
      kode: 'SP-MTR-VBELT-B65', nama: 'V-Belt B65',
      kategoriId: kategoriMotor.id, satuan: 'pcs',
      stok: 25, stokMinimum: 10, hargaBeli: 95000, hargaJual: 130000,
      lokasiRak: 'C3-02',
    },
  })
  const sp7 = await db.sparepart.create({
    data: {
      kode: 'SP-HYD-POMPA-G15', nama: 'Pompa Hidrolik Gear G15',
      kategoriId: kategoriHidrolik.id, satuan: 'unit',
      stok: 1, stokMinimum: 2, hargaBeli: 12500000, hargaJual: 15000000,
      lokasiRak: 'Palet 7', catatan: 'CRITICAL - press hidrolik',
    },
  })
  const sp8 = await db.sparepart.create({
    data: {
      kode: 'SP-HYD-SILND-100', nama: 'Silinder Hidrolik 100x500mm',
      kategoriId: kategoriHidrolik.id, satuan: 'unit',
      stok: 3, stokMinimum: 2, hargaBeli: 4500000, hargaJual: 5500000,
      lokasiRak: 'Palet 8',
    },
  })
  const sp9 = await db.sparepart.create({
    data: {
      kode: 'SP-ELK-KONT-LC1D25', nama: 'Kontaktor LC1D25',
      kategoriId: kategoriElektrik.id, satuan: 'pcs',
      stok: 12, stokMinimum: 5, hargaBeli: 685000, hargaJual: 850000,
      lokasiRak: 'D1-03',
    },
  })
  const sp10 = await db.sparepart.create({
    data: {
      kode: 'SP-ELK-RELAY-RXM', nama: 'Relay RXM 4 CO 24VDC',
      kategoriId: kategoriElektrik.id, satuan: 'pcs',
      stok: 0, stokMinimum: 10, hargaBeli: 145000, hargaJual: 195000,
      lokasiRak: 'D1-08', catatan: 'STOK HABIS - segera PO',
    },
  })
  const sp11 = await db.sparepart.create({
    data: {
      kode: 'SP-SL-OILSEAL-100', nama: 'Oil Seal TC 100x125x12',
      kategoriId: kategoriSegel.id, satuan: 'pcs',
      stok: 15, stokMinimum: 8, hargaBeli: 35000, hargaJual: 55000,
      lokasiRak: 'E2-04',
    },
  })
  const sp12 = await db.sparepart.create({
    data: {
      kode: 'SP-SL-ORING-120', nama: 'O-Ring 120mm Viton',
      kategoriId: kategoriSegel.id, satuan: 'pcs',
      stok: 40, stokMinimum: 15, hargaBeli: 18000, hargaJual: 32000,
      lokasiRak: 'E2-09',
    },
  })
  const sp13 = await db.sparepart.create({
    data: {
      kode: 'SP-BRG-22220', nama: 'Bearing Roller 22220 E',
      kategoriId: kategoriBearing.id, satuan: 'pcs',
      stok: 5, stokMinimum: 4, hargaBeli: 1850000, hargaJual: 2350000,
      lokasiRak: 'A2-01',
    },
  })
  const sp14 = await db.sparepart.create({
    data: {
      kode: 'SP-HYD-HOSE-3/4', nama: 'Selang Hidrolik 3/4 inch',
      kategoriId: kategoriHidrolik.id, satuan: 'meter',
      stok: 60, stokMinimum: 30, hargaBeli: 85000, hargaJual: 120000,
      lokasiRak: 'F1-02',
    },
  })
  const sp15 = await db.sparepart.create({
    data: {
      kode: 'SP-ELK-SENSOR-PROX', nama: 'Sensor Proximity PNP NO M12',
      kategoriId: kategoriElektrik.id, satuan: 'pcs',
      stok: 18, stokMinimum: 6, hargaBeli: 285000, hargaJual: 395000,
      lokasiRak: 'D2-05',
    },
  })

  // === KOMPATIBILITAS MESIN-SPAREPART ===
  await db.mesinSparepart.createMany({
    data: [
      { mesinId: mesin1.id, sparepartId: sp1.id },
      { mesinId: mesin1.id, sparepartId: sp11.id },
      { mesinId: mesin1.id, sparepartId: sp13.id },
      { mesinId: mesin2.id, sparepartId: sp1.id },
      { mesinId: mesin2.id, sparepartId: sp4.id },
      { mesinId: mesin2.id, sparepartId: sp11.id },
      { mesinId: mesin2.id, sparepartId: sp3.id },
      { mesinId: mesin3.id, sparepartId: sp5.id },
      { mesinId: mesin3.id, sparepartId: sp6.id },
      { mesinId: mesin3.id, sparepartId: sp9.id },
      { mesinId: mesin3.id, sparepartId: sp10.id },
      { mesinId: mesin4.id, sparepartId: sp7.id },
      { mesinId: mesin4.id, sparepartId: sp8.id },
      { mesinId: mesin4.id, sparepartId: sp14.id },
      { mesinId: mesin4.id, sparepartId: sp12.id },
      { mesinId: mesin5.id, sparepartId: sp3.id },
      { mesinId: mesin5.id, sparepartId: sp4.id },
      { mesinId: mesin5.id, sparepartId: sp11.id },
      { mesinId: mesin5.id, sparepartId: sp13.id },
    ],
  })

  // === TRANSAKSI STOK ===
  await db.transaksiStok.createMany({
    data: [
      { sparepartId: sp1.id, tipe: 'MASUK', jumlah: 100, referensi: 'PO-2025-001', catatan: 'Pembelian awal Q1', tanggal: new Date('2025-01-15') },
      { sparepartId: sp1.id, tipe: 'KELUAR', jumlah: 50, referensi: 'WO-2025-045', catatan: 'Service rutin mesin pompa', tanggal: new Date('2025-03-08') },
      { sparepartId: sp2.id, tipe: 'MASUK', jumlah: 30, referensi: 'PO-2025-008', catatan: 'Restock', tanggal: new Date('2025-02-10') },
      { sparepartId: sp2.id, tipe: 'KELUAR', jumlah: 22, referensi: 'WO-2025-051', catatan: 'Overhaul pompa', tanggal: new Date('2025-04-22') },
      { sparepartId: sp10.id, tipe: 'KELUAR', jumlah: 12, referensi: 'WO-2025-060', catatan: 'Perbaikan panel kontrol', tanggal: new Date('2025-05-12') },
      { sparepartId: sp5.id, tipe: 'MASUK', jumlah: 4, referensi: 'PO-2025-012', catatan: 'Pembelian motor backup', tanggal: new Date('2025-04-01') },
      { sparepartId: sp5.id, tipe: 'KELUAR', jumlah: 2, referensi: 'WO-2025-058', catatan: 'Penggantian motor konveyor', tanggal: new Date('2025-05-20') },
      { sparepartId: sp7.id, tipe: 'MASUK', jumlah: 2, referensi: 'PO-2025-015', catatan: 'Stock critical part', tanggal: new Date('2025-03-15') },
      { sparepartId: sp7.id, tipe: 'KELUAR', jumlah: 1, referensi: 'WO-2025-062', catatan: 'Service press hidrolik', tanggal: new Date('2025-06-05') },
      { sparepartId: sp4.id, tipe: 'KELUAR', jumlah: 3, referensi: 'WO-2025-055', catatan: 'Ganti filter kompressor', tanggal: new Date('2025-05-25') },
      { sparepartId: sp6.id, tipe: 'MASUK', jumlah: 50, referensi: 'PO-2025-020', catatan: 'Restock V-belt', tanggal: new Date('2025-06-01') },
      { sparepartId: sp6.id, tipe: 'KELUAR', jumlah: 25, referensi: 'WO-2025-070', catatan: 'Service konveyor', tanggal: new Date('2025-07-10') },
      { sparepartId: sp9.id, tipe: 'MASUK', jumlah: 20, referensi: 'PO-2025-022', catatan: 'Restock kontaktor', tanggal: new Date('2025-06-20') },
      { sparepartId: sp9.id, tipe: 'KELUAR', jumlah: 8, referensi: 'WO-2025-065', catatan: 'Penggantian kontaktor', tanggal: new Date('2025-07-15') },
      { sparepartId: sp14.id, tipe: 'MASUK', jumlah: 100, referensi: 'PO-2025-025', catatan: 'Pembelian selang', tanggal: new Date('2025-07-01') },
      { sparepartId: sp14.id, tipe: 'KELUAR', jumlah: 40, referensi: 'WO-2025-068', catatan: 'Penggantian selang press', tanggal: new Date('2025-07-18') },
      { sparepartId: sp12.id, tipe: 'MASUK', jumlah: 50, referensi: 'PO-2025-018', catatan: 'Restock O-ring', tanggal: new Date('2025-05-10') },
      { sparepartId: sp12.id, tipe: 'KELUAR', jumlah: 10, referensi: 'WO-2025-067', catatan: 'Service silinder', tanggal: new Date('2025-07-12') },
      { sparepartId: sp3.id, tipe: 'MASUK', jumlah: 40, referensi: 'PO-2025-029', catatan: 'Restock filter oli', tanggal: new Date('2025-08-01') },
      { sparepartId: sp3.id, tipe: 'KELUAR', jumlah: 10, referensi: 'WO-2025-075', catatan: 'Service boiler', tanggal: new Date('2025-08-22') },
    ],
  })

  console.log('✅ Seed berhasil! Users: 3, Kategori: 6, Mesin: 5, Sparepart: 15, Transaksi: 20')
  console.log('   Login: admin/admin123, operator/operator123, gudang/gudang123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
