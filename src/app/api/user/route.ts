import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperadmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // Hanya superadmin yang bisa lihat daftar user
  const user = requireSuperadmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Superadmin.' }, { status: 403 })
  }

  try {
    const users = await db.user.findMany({
      orderBy: { role: 'asc' },
      include: { _count: { select: { transaksi: true } } },
    })
    // Jangan return password
    const safe = users.map((u) => ({
      id: u.id,
      nama: u.nama,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      _count: { transaksi: u._count.transaksi },
    }))
    return NextResponse.json(safe)
  } catch (error) {
    console.error('GET /api/user error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data user' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = requireSuperadmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Akses ditolak. Hanya Superadmin.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { nama, username, password, role } = body

    if (!nama || !username || !password) {
      return NextResponse.json({ error: 'Nama, username, dan password wajib diisi' }, { status: 400 })
    }
    const validRoles = ['SUPERADMIN', 'ADMIN', 'OPERATOR', 'GUDANG']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
    }

    const newUser = await db.user.create({
      data: {
        nama,
        username,
        password, // plain text untuk demo; production harus hash
        role: role || 'OPERATOR',
      },
    })
    return NextResponse.json({
      id: newUser.id,
      nama: newUser.nama,
      username: newUser.username,
      role: newUser.role,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/user error:', error)
    return NextResponse.json({ error: 'Gagal menambah user' }, { status: 500 })
  }
}
