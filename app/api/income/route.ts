import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: true, data: [] })
    const where: Record<string, unknown> = { userId: user.id }
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    const income = await prisma.income.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ success: true, data: income })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: false, error: 'No user' }, { status: 404 })
    const income = await prisma.income.create({
      data: {
        userId: user.id,
        source: body.source,
        amount: parseFloat(body.amount),
        month: body.month ?? new Date().getMonth() + 1,
        year: body.year ?? new Date().getFullYear(),
        isRecurring: body.isRecurring ?? false,
        note: body.note ?? null,
      },
    })
    return NextResponse.json({ success: true, data: income }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    await prisma.income.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true, data: null })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
