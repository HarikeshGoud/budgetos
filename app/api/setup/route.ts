import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SetupSchema = z.object({
  name: z.string().min(1),
  currency: z.string().default('INR'),
  savingsGoal: z.number().min(0).max(100).default(20),
  monthlyIncome: z.number().min(0),
  incomeSource: z.string().default('salary'),
  budgetLimits: z.record(z.string(), z.number()).optional(),
})

export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    return NextResponse.json({ success: true, data: user })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SetupSchema.parse(body)

    const existingUser = await prisma.user.findFirst()
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already set up' }, { status: 400 })
    }

    const now = new Date()
    const user = await prisma.user.create({
      data: { name: parsed.name, currency: parsed.currency, savingsGoal: parsed.savingsGoal },
    })

    if (parsed.monthlyIncome > 0) {
      await prisma.income.create({
        data: { userId: user.id, source: parsed.incomeSource, amount: parsed.monthlyIncome, month: now.getMonth() + 1, year: now.getFullYear(), isRecurring: true },
      })
    }

    if (parsed.budgetLimits) {
      const limits = Object.entries(parsed.budgetLimits).map(([category, limit]) => ({ userId: user.id, category, limit }))
      if (limits.length > 0) await prisma.budgetLimit.createMany({ data: limits })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Setup failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await prisma.user.findFirst()
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: body.name ?? user.name, currency: body.currency ?? user.currency, savingsGoal: body.savingsGoal ?? user.savingsGoal },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}
