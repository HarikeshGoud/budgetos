import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const expense = await prisma.expense.findUnique({ where: { id: parseInt(id) } })
    if (!expense) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: expense })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const expense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        category: body.category,
        subCategory: body.subCategory,
        paymentMethod: body.paymentMethod,
        note: body.note,
        date: body.date ? new Date(body.date) : undefined,
        isRecurring: body.isRecurring,
      },
    })
    return NextResponse.json({ success: true, data: expense })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.expense.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true, data: null })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
