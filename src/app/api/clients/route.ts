import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const clients = await db.client.findMany({
    orderBy: { criadoEm: 'desc' },
    include: { propostas: { orderBy: { criadoEm: 'desc' } } },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const client = await db.client.create({ data: body })
  return NextResponse.json(client, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await db.proposal.deleteMany({ where: { clientId: id } })
  await db.client.delete({ where: { id } })
  return NextResponse.json({ success: true })
}