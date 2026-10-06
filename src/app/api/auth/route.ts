import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Login dengan cookie sederhana (BASE64-encoded JSON) — demo only.
// Production: gunakan NextAuth.js / jwt / session encryption.
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const session = {
      userId: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
    }
    const token = Buffer.from(JSON.stringify(session)).toString('base64')

    const res = NextResponse.json({
      user: session,
      message: 'Login berhasil',
    })
    res.cookies.set('sp_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    })
    return res
  } catch (error) {
    console.error('POST /api/auth error:', error)
    return NextResponse.json({ error: 'Gagal login' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ message: 'Logout berhasil' })
  res.cookies.delete('sp_session')
  return res
}
