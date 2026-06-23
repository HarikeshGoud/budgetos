import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const category = searchParams.get('category')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: true, data: { expenses: [], total: 0 } })

    const where: Record<string, unknown> = { userId: user.id }

    if (category && category !== 'all') where.category = category
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) (where.amount as Record<string, unknown>).gte = parseFloat(minAmount)
      if (maxAmount) (where.amount as Record<string, unknown>).lte = parseFloat(maxAmount)
    }
    if (search) {
      where.OR = [
        { note: { contains: search } },
        { category: { contains: search } },
        { subCategory: { contains: search } },
      ]
    }

    if (month && year) {
      const m = parseInt(month), y = parseInt(year)
      where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) }
    } else if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    const sortBy = searchParams.get('sortBy') ?? 'date'
    const sortOrder = searchParams.get('sortOrder') ?? 'desc'

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * limit, take: limit }),
      prisma.expense.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { expenses, total, page, limit } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: false, error: 'No user found' }, { status: 404 })

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        amount: parseFloat(body.amount),
        category: body.category,
        subCategory: body.subCategory ?? null,
        paymentMethod: body.paymentMethod ?? 'UPI',
        note: body.note ?? null,
        date: body.date ? new Date(body.date) : new Date(),
        isRecurring: body.isRecurring ?? false,
        receiptPath: body.receiptPath ?? null,
      },
    })
    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
