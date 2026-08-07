import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const etapas = [];
    for (let i = 1; i <= 10; i++) {
      const field = proposal[`etapa${i}` as keyof typeof proposal] as string | null;
      if (field) {
        try {
          etapas.push(JSON.parse(field));
        } catch {
          etapas.push({ etapa: i, titulo: `Etapa ${i}`, conteudo: field });
        }
      }
    }

    let precificacao = null;
    if (proposal.precificacao) {
      try { precificacao = JSON.parse(proposal.precificacao); } catch { precificacao = null; }
    }

    return NextResponse.json({ ...proposal, etapas, precificacao });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json({ error: 'Erro ao buscar proposta' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.precificacao) updateData.precificacao = body.precificacao;

    const proposal = await db.proposal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: 'Erro ao atualizar proposta' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.proposal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: 'Erro ao deletar proposta' }, { status: 500 });
  }
}
