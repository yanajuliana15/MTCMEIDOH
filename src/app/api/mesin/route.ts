import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { kode: { contains: search } },
        { nama: { contains: search } },
        { manufaktur: { contains: search } },
      ]
    }
    if (status) where.status = status

    const mesin = await db.mesin.findMany({
      where,
      include: {
        spareparts: { include: { sparepart: true } },
      },
      orderBy: { kode: 'asc' },
    })
    return NextResponse.json(mesin)
  } catch (error) {
    console.error('GET /api/mesin error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data mesin' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kode, nama, lokasi, manufaktur, tahunInstal, status, sparepartIds } = body
    if (!kode || !nama) {
      return NextResponse.json({ error: 'Kode dan nama mesin wajib diisi' }, { status: 400 })
    }
    const existing = await db.mesin.findUnique({ where: { kode } })
    if (existing) {
      return NextResponse.json({ error: 'Kode mesin sudah digunakan' }, { status: 400 })
    }
    const mesin = await db.mesin.create({
      data: {
        kode,
        nama,
        lokasi: lokasi || null,
        manufaktur: manufaktur || null,
        tahunInstal: tahunInstal ? Number(tahunInstal) : null,
        status: status || 'Aktif',
        ...(sparepartIds?.length
          ? { spareparts: { create: sparepartIds.map((id: string) => ({ sparepartId: id })) } }
          : {}),
      },
      include: { spareparts: { include: { sparepart: true } } },
    })
    return NextResponse.json(mesin, { status: 201 })
  } catch (error) {
    console.error('POST /api/mesin error:', error)
    return NextResponse.json({ error: 'Gagal menambah mesin' }, { status: 500 })
  }
}
