import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        _count: { select: { propostas: true } },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const client = await db.client.create({
      data: {
        nome: body.nome,
        whatsapp: body.whatsapp,
        email: body.email || null,
        bairro: body.bairro,
        indicacao: body.indicacao || null,
        moradores: body.moradores,
        criancas: body.criancas,
        idosos: body.idosos,
        animais: body.animais ?? null,
        servico: JSON.stringify(body.servicos || []),
        dias: body.dias,
        estilo: body.estilo,
        restricoes: body.temRestricoes
          ? JSON.stringify({ has: true, alergias: body.temAlergias, details: body.detalhesRestricoes })
          : JSON.stringify({ has: false, alergias: false, details: '' }),
        preferencias: body.preferencias || null,
        rejeicoes: body.rejeicoes || null,
        freezer: body.temFreezer ? body.freezerTamanho : 'Nao',
        compras: body.compras,
        periodo: body.periodo,
        entrega: body.entrega,
        observacoes: body.observacoes || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
