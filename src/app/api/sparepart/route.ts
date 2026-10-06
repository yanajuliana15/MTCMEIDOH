import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const kategoriId = searchParams.get('kategoriId') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const statusStok = searchParams.get('statusStok') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { kode: { contains: search } },
        { nama: { contains: search } },
      ]
    }
    if (kategoriId) where.kategoriId = kategoriId
    if (supplierId) where.supplierId = supplierId

    let spareparts = await db.sparepart.findMany({
      where,
      include: {
        kategori: true,
        supplier: true,
        mesin: { include: { mesin: true } },
      },
      orderBy: { kode: 'asc' },
    })

    if (statusStok === 'menipis') {
      spareparts = spareparts.filter((s) => s.stok <= s.stokMinimum)
    } else if (statusStok === 'habis') {
      spareparts = spareparts.filter((s) => s.stok === 0)
    } else if (statusStok === 'aman') {
      spareparts = spareparts.filter((s) => s.stok > s.stokMinimum)
    }

    return NextResponse.json(spareparts)
  } catch (error) {
    console.error('GET /api/sparepart error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data sparepart' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kode, nama, kategoriId, supplierId, satuan, stok, stokMinimum, hargaBeli, hargaJual, lokasiRak, catatan, mesinIds } = body

    if (!kode || !nama) {
      return NextResponse.json({ error: 'Kode dan nama sparepart wajib diisi' }, { status: 400 })
    }

    const existing = await db.sparepart.findUnique({ where: { kode } })
    if (existing) {
      return NextResponse.json({ error: 'Kode sparepart sudah digunakan' }, { status: 400 })
    }

    const sparepart = await db.sparepart.create({
      data: {
        kode,
        nama,
        kategoriId: kategoriId || null,
        supplierId: supplierId || null,
        satuan: satuan || 'pcs',
        stok: Number(stok) || 0,
        stokMinimum: Number(stokMinimum) || 0,
        hargaBeli: Number(hargaBeli) || 0,
        hargaJual: Number(hargaJual) || 0,
        lokasiRak: lokasiRak || null,
        catatan: catatan || null,
        ...(mesinIds?.length
          ? { mesin: { create: mesinIds.map((id: string) => ({ mesinId: id })) } }
          : {}),
      },
      include: { kategori: true, supplier: true, mesin: { include: { mesin: true } } },
    })

    if (Number(stok) > 0) {
      await db.transaksiStok.create({
        data: {
          sparepartId: sparepart.id,
          tipe: 'MASUK',
          jumlah: Number(stok),
          referensi: 'STOK-AWAL',
          catatan: 'Stok awal saat pembuatan sparepart',
        },
      })
    }

    return NextResponse.json(sparepart, { status: 201 })
  } catch (error) {
    console.error('POST /api/sparepart error:', error)
    return NextResponse.json({ error: 'Gagal menambah sparepart' }, { status: 500 })
  }
}
