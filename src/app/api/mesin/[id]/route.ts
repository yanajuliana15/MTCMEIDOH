import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const mesin = await db.mesin.findUnique({
      where: { id },
      include: { spareparts: { include: { sparepart: { include: { kategori: true, supplier: true } } } } },
    })
    if (!mesin) {
      return NextResponse.json({ error: 'Mesin tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(mesin)
  } catch (error) {
    console.error('GET /api/mesin/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data mesin' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { kode, nama, lokasi, manufaktur, tahunInstal, status, sparepartIds } = body

    const existing = await db.mesin.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mesin tidak ditemukan' }, { status: 404 })
    }

    if (kode && kode !== existing.kode) {
      const dup = await db.mesin.findUnique({ where: { kode } })
      if (dup) {
        return NextResponse.json({ error: 'Kode mesin sudah digunakan' }, { status: 400 })
      }
    }

    if (sparepartIds !== undefined) {
      await db.mesinSparepart.deleteMany({ where: { mesinId: id } })
      if (sparepartIds.length > 0) {
        await db.mesinSparepart.createMany({
          data: sparepartIds.map((sid: string) => ({ mesinId: id, sparepartId: sid })),
        })
      }
    }

    const updated = await db.mesin.update({
      where: { id },
      data: {
        kode: kode || existing.kode,
        nama: nama || existing.nama,
        lokasi: lokasi === '' ? null : lokasi || existing.lokasi,
        manufaktur: manufaktur === '' ? null : manufaktur || existing.manufaktur,
        tahunInstal: tahunInstal ? Number(tahunInstal) : existing.tahunInstal,
        status: status || existing.status,
      },
      include: { spareparts: { include: { sparepart: true } } },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/mesin/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengupdate mesin' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.mesin.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/mesin/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus mesin' }, { status: 500 })
  }
}
