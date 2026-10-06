import { NextRequest } from 'next/server'
import type { User } from '@/lib/types'

/**
 * Ambil session user dari cookie sp_session (BASE64 JSON).
 * Return null jika belum login atau cookie tidak valid.
 */
export function getSessionUser(req: NextRequest): User | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/sp_session=([^;]+)/)
  if (!match) return null
  try {
    // Cookie value bisa URL-encoded (misal %3D untuk =), decode dulu
    const raw = decodeURIComponent(match[1])
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as User
  } catch {
    return null
  }
}

/**
 * Cek apakah user adalah ADMIN atau SUPERADMIN.
 * Return user jika admin/superadmin, null jika bukan.
 */
export function requireAdmin(req: NextRequest): User | null {
  const user = getSessionUser(req)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) return null
  return user
}

/**
 * Cek apakah user adalah SUPERADMIN.
 * Return user jika superadmin, null jika bukan.
 */
export function requireSuperadmin(req: NextRequest): User | null {
  const user = getSessionUser(req)
  if (!user || user.role !== 'SUPERADMIN') return null
  return user
}
