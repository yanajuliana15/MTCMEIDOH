import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sparepart = await db.sparepart.findUnique({
      where: { id },
      include: {
        kategori: true, supplier: true,
        mesin: { include: { mesin: true } },
        transaksi: { orderBy: { tanggal: 'desc' }, take: 20 },
      },
    })
    if (!sparepart) return NextResponse.json({ error: 'Sparepart tidak ditemukan' }, { status: 404 })
    return NextResponse.json(sparepart)
  } catch (error) {
    console.error('GET /api/sparepart/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { kode, nama, kategoriId, supplierId, satuan, stokMinimum, hargaBeli, hargaJual, lokasiRak, catatan, mesinIds } = body

    const existing = await db.sparepart.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Sparepart tidak ditemukan' }, { status: 404 })

    if (kode && kode !== existing.kode) {
      const dup = await db.sparepart.findUnique({ where: { kode } })
      if (dup) return NextResponse.json({ error: 'Kode sudah digunakan' }, { status: 400 })
    }

    if (mesinIds !== undefined) {
      await db.mesinSparepart.deleteMany({ where: { sparepartId: id } })
      if (mesinIds.length > 0) {
        await db.mesinSparepart.createMany({
          data: mesinIds.map((mid: string) => ({ mesinId: mid, sparepartId: id })),
        })
      }
    }

    const updated = await db.sparepart.update({
      where: { id },
      data: {
        kode: kode || existing.kode,
        nama: nama || existing.nama,
        kategoriId: kategoriId === '' ? null : kategoriId || existing.kategoriId,
        supplierId: supplierId === '' ? null : supplierId || existing.supplierId,
        satuan: satuan || existing.satuan,
        stokMinimum: Number(stokMinimum) ?? existing.stokMinimum,
        hargaBeli: Number(hargaBeli) ?? existing.hargaBeli,
        hargaJual: Number(hargaJual) ?? existing.hargaJual,
        lokasiRak: lokasiRak === '' ? null : lokasiRak || existing.lokasiRak,
        catatan: catatan === '' ? null : catatan || existing.catatan,
      },
      include: { kategori: true, supplier: true, mesin: { include: { mesin: true } } },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/sparepart/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengupdate sparepart' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.sparepart.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/sparepart/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus sparepart' }, { status: 500 })
  }
}
