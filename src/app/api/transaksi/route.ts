import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sparepartId = searchParams.get('sparepartId') || ''
    const tipe = searchParams.get('tipe') || ''

    const where: any = {}
    if (sparepartId) where.sparepartId = sparepartId
    if (tipe) where.tipe = tipe

    const transaksi = await db.transaksiStok.findMany({
      where,
      include: { sparepart: true },
      orderBy: { tanggal: 'desc' },
      take: 100,
    })
    return NextResponse.json(transaksi)
  } catch (error) {
    console.error('GET /api/transaksi error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data transaksi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sparepartId, tipe, jumlah, referensi, catatan, tanggal } = body

    if (!sparepartId || !tipe || !jumlah) {
      return NextResponse.json({ error: 'Sparepart, tipe, dan jumlah wajib diisi' }, { status: 400 })
    }
    if (tipe !== 'MASUK' && tipe !== 'KELUAR') {
      return NextResponse.json({ error: 'Tipe harus MASUK atau KELUAR' }, { status: 400 })
    }
    if (Number(jumlah) <= 0) {
      return NextResponse.json({ error: 'Jumlah harus lebih besar dari 0' }, { status: 400 })
    }

    const sparepart = await db.sparepart.findUnique({ where: { id: sparepartId } })
    if (!sparepart) {
      return NextResponse.json({ error: 'Sparepart tidak ditemukan' }, { status: 404 })
    }

    // Validasi stok untuk KELUAR
    if (tipe === 'KELUAR' && Number(jumlah) > sparepart.stok) {
      return NextResponse.json(
        { error: `Stok tidak mencukupi. Stok saat ini: ${sparepart.stok} ${sparepart.satuan}` },
        { status: 400 }
      )
    }

    // Buat transaksi dan update stok
    const [transaksi, updatedSparepart] = await db.$transaction([
      db.transaksiStok.create({
        data: {
          sparepartId,
          tipe,
          jumlah: Number(jumlah),
          referensi: referensi || null,
          catatan: catatan || null,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
        },
      }),
      db.sparepart.update({
        where: { id: sparepartId },
        data: {
          stok: tipe === 'MASUK' ? { increment: Number(jumlah) } : { decrement: Number(jumlah) },
        },
      }),
    ])

    return NextResponse.json(
      { transaksi, stokBaru: updatedSparepart.stok },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/transaksi error:', error)
    return NextResponse.json({ error: 'Gagal membuat transaksi' }, { status: 500 })
  }
}
