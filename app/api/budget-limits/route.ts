import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: true, data: [] })
    const limits = await prisma.budgetLimit.findMany({ where: { userId: user.id } })
    return NextResponse.json({ success: true, data: limits })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: false, error: 'No user' }, { status: 404 })
    const existing = await prisma.budgetLimit.findFirst({ where: { userId: user.id, category: body.category } })
    let limit
    if (existing) {
      limit = await prisma.budgetLimit.update({ where: { id: existing.id }, data: { limit: parseFloat(body.limit) } })
    } else {
      limit = await prisma.budgetLimit.create({ data: { userId: user.id, category: body.category, limit: parseFloat(body.limit), month: body.month ?? null, year: body.year ?? null } })
    }
    return NextResponse.json({ success: true, data: limit })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: false, error: 'No user' }, { status: 404 })
    const results = []
    for (const [category, limitVal] of Object.entries(body.limits as Record<string, number>)) {
      const existing = await prisma.budgetLimit.findFirst({ where: { userId: user.id, category } })
      if (existing) {
        results.push(await prisma.budgetLimit.update({ where: { id: existing.id }, data: { limit: limitVal } }))
      } else {
        results.push(await prisma.budgetLimit.create({ data: { userId: user.id, category, limit: limitVal } }))
      }
    }
    return NextResponse.json({ success: true, data: results })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
