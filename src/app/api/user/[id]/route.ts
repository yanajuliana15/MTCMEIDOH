import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperadmin } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = requireSuperadmin(req)
  if (!currentUser) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Superadmin.' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { nama, username, password, role } = body

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Cek username unik bila diubah
    if (username && username !== existing.username) {
      const dup = await db.user.findUnique({ where: { username } })
      if (dup) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
      }
    }

    // Validasi role
    const validRoles = ['SUPERADMIN', 'ADMIN', 'OPERATOR', 'GUDANG']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    // Pencegahan: superadmin tidak bisa menurunkan dirinya sendiri
    if (currentUser.id === id && role && role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Anda tidak bisa menurunkan role akun sendiri' },
        { status: 400 }
      )
    }

    // Pencegahan: superadmin tidak bisa menghapus role superadmin terakhir
    if (existing.role === 'SUPERADMIN' && role && role !== 'SUPERADMIN') {
      const superadminCount = await db.user.count({ where: { role: 'SUPERADMIN' } })
      if (superadminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak bisa menurunkan superadmin terakhir. Wajib ada minimal 1 superadmin.' },
          { status: 400 }
        )
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        nama: nama || existing.nama,
        username: username || existing.username,
        role: role || existing.role,
        ...(password ? { password } : {}), // update password hanya jika diisi
      },
    })

    return NextResponse.json({
      id: updated.id,
      nama: updated.nama,
      username: updated.username,
      role: updated.role,
    })
  } catch (error) {
    console.error('PUT /api/user/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengupdate user' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = requireSuperadmin(req)
  if (!currentUser) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Superadmin.' }, { status: 403 })
  }

  try {
    const { id } = await params

    // Tidak boleh hapus diri sendiri
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Anda tidak bisa menghapus akun sendiri' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Pencegahan: tidak boleh hapus superadmin terakhir
    if (existing.role === 'SUPERADMIN') {
      const superadminCount = await db.user.count({ where: { role: 'SUPERADMIN' } })
      if (superadminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak bisa menghapus superadmin terakhir' },
          { status: 400 }
        )
      }
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/user/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 })
  }
}
