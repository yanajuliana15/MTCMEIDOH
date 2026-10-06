import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/sp_session=([^;]+)/)
    if (!match) {
      return NextResponse.json({ user: null })
    }
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
    const session = JSON.parse(decoded)
    return NextResponse.json({ user: session })
  } catch {
    return NextResponse.json({ user: null })
  }
}
