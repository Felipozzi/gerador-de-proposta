import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  if (clientId) {
    const proposals = await db.proposal.findMany({
      where: { clientId },
      orderBy: { criadoEm: 'desc' },
    })
    return NextResponse.json(proposals)
  }
  const all = await db.proposal.findMany({
    orderBy: { criadoEm: 'desc' },
    include: { client: true },
  })
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const proposal = await db.proposal.create({
    data: {
      clientId: body.clientId,
      etapa1: body.etapa1,
      etapa2: body.etapa2,
      etapa3: body.etapa3,
      etapa4: body.etapa4,
      etapa5: body.etapa5,
      etapa6: body.etapa6,
      etapa7: body.etapa7,
      etapa8: body.etapa8,
      etapa9: body.etapa9,
      etapa10: body.etapa10,
      precificacao: body.precificacao,
      status: body.status || 'gerada',
    },
  })
  return NextResponse.json(proposal, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const proposal = await db.proposal.update({
    where: { id },
    data,
  })
  return NextResponse.json(proposal)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await db.proposal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}