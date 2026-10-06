import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalSparepart, totalMesin, totalSupplier, totalKategori, allSparepart, recentTransaksi, mesinStatus] =
      await Promise.all([
        db.sparepart.count(),
        db.mesin.count(),
        db.supplier.count(),
        db.kategori.count(),
        db.sparepart.findMany({ select: { stok: true, stokMinimum: true, hargaBeli: true, hargaJual: true, satuan: true, kategoriId: true, kategori: true } }),
        db.transaksiStok.findMany({
          take: 8,
          orderBy: { tanggal: 'desc' },
          include: { sparepart: { select: { kode: true, nama: true, satuan: true } } },
        }),
        db.mesin.groupBy({ by: ['status'], _count: true }),
      ])

    const stokMenipis = allSparepart.filter((s) => s.stok <= s.stokMinimum && s.stok > 0).length
    const stokHabis = allSparepart.filter((s) => s.stok === 0).length
    const stokAman = allSparepart.filter((s) => s.stok > s.stokMinimum).length
    const totalNilaiStok = allSparepart.reduce((sum, s) => sum + s.stok * s.hargaBeli, 0)
    const totalNilaiJual = allSparepart.reduce((sum, s) => sum + s.stok * s.hargaJual, 0)

    // Distribusi per kategori
    const kategoriMap = new Map<string, { nama: string; jumlah: number; nilai: number }>()
    for (const s of allSparepart) {
      const namaKategori = s.kategori?.nama || 'Tidak Berkategori'
      const existing = kategoriMap.get(namaKategori) || { nama: namaKategori, jumlah: 0, nilai: 0 }
      existing.jumlah += 1
      existing.nilai += s.stok * s.hargaBeli
      kategoriMap.set(namaKategori, existing)
    }
    const distribusiKategori = Array.from(kategoriMap.values()).sort((a, b) => b.jumlah - a.jumlah)

    // Status mesin
    const statusMesin = mesinStatus.map((s) => ({ status: s.status, jumlah: s._count }))

    return NextResponse.json({
      totalSparepart,
      totalMesin,
      totalSupplier,
      totalKategori,
      stokMenipis,
      stokHabis,
      stokAman,
      totalNilaiStok,
      totalNilaiJual,
      distribusiKategori,
      statusMesin,
      recentTransaksi,
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data dashboard' }, { status: 500 })
  }
}
