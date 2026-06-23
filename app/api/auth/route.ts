import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const expected = process.env.SITE_PASSWORD

  if (!expected || password !== expected) {
    return NextResponse.json({ success: false, error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('budgetos_auth', expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('budgetos_auth')
  return res
}
