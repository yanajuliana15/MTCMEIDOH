import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const kategori = await db.kategori.findMany({
      include: { _count: { select: { spareparts: true } } },
      orderBy: { nama: 'asc' },
    })
    return NextResponse.json(kategori)
  } catch (error) {
    console.error('GET /api/kategori error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data kategori' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nama, deskripsi } = body
    if (!nama) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
    }
    const existing = await db.kategori.findUnique({ where: { nama } })
    if (existing) {
      return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 400 })
    }
    const kategori = await db.kategori.create({ data: { nama, deskripsi } })
    return NextResponse.json(kategori, { status: 201 })
  } catch (error) {
    console.error('POST /api/kategori error:', error)
    return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 })
  }
}
