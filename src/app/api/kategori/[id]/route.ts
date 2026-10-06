import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nama, deskripsi } = body
    const existing = await db.kategori.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }
    const updated = await db.kategori.update({
      where: { id },
      data: { nama: nama || existing.nama, deskripsi: deskripsi ?? existing.deskripsi },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/kategori/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengupdate kategori' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.kategori.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/kategori/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 })
  }
}
