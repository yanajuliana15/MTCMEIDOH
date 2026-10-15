import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nama, kontak, telepon, email, alamat } = body
    const existing = await db.supplier.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 })
    const updated = await db.supplier.update({
      where: { id },
      data: {
        nama: nama || existing.nama,
        kontak: kontak === '' ? null : kontak ?? existing.kontak,
        telepon: telepon === '' ? null : telepon ?? existing.telepon,
        email: email === '' ? null : email ?? existing.email,
        alamat: alamat === '' ? null : alamat ?? existing.alamat,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/supplier/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengupdate supplier' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.supplier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/supplier/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus supplier' }, { status: 500 })
  }
}
