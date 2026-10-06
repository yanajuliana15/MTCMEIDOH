import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const where: any = {}
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { kontak: { contains: search } },
        { email: { contains: search } },
      ]
    }
    const supplier = await db.supplier.findMany({
      where,
      include: { _count: { select: { spareparts: true } } },
      orderBy: { nama: 'asc' },
    })
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('GET /api/supplier error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data supplier' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nama, kontak, telepon, email, alamat } = body
    if (!nama) {
      return NextResponse.json({ error: 'Nama supplier wajib diisi' }, { status: 400 })
    }
    const supplier = await db.supplier.create({
      data: { nama, kontak: kontak || null, telepon: telepon || null, email: email || null, alamat: alamat || null },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('POST /api/supplier error:', error)
    return NextResponse.json({ error: 'Gagal menambah supplier' }, { status: 500 })
  }
}
