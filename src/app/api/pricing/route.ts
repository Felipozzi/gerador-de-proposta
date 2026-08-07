import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_SERVICOS = [
  { servico: 'meal_prep_7',  label: 'Meal Prep Semanal (7 dias)',  valor: 650,  unidade: 'sessão',  ordem: 1 },
  { servico: 'meal_prep_15', label: 'Meal Prep Quinzenal (15 dias)', valor: 600,  unidade: 'sessão',  ordem: 2 },
  { servico: 'meal_prep_30', label: 'Meal Prep Mensal (30 dias)',  valor: 550,  unidade: 'sessão',  ordem: 3 },
  { servico: 'organizacao',  label: 'Organização de Cozinha',       valor: 350,  unidade: 'serviço', ordem: 4 },
  { servico: 'planejamento', label: 'Planejamento de Cardápio',     valor: 200,  unidade: 'mês',    ordem: 5 },
  { servico: 'compras',      label: 'Compras Assistidas',           valor: 150,  unidade: 'visita',  ordem: 6 },
  { servico: 'evento',       label: 'Evento em Casa',               valor: 800,  unidade: 'evento',  ordem: 7 },
];

export async function GET() {
  try {
    let configs = await db.pricingConfig.findMany({ orderBy: { ordem: 'asc' } });

    // Seed defaults if empty
    if (configs.length === 0) {
      await db.pricingConfig.createMany({ data: DEFAULT_SERVICOS });
      configs = await db.pricingConfig.findMany({ orderBy: { ordem: 'asc' } });
    }

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: 'Erro ao buscar preços' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const results = [];

    for (const item of body) {
      const updated = await db.pricingConfig.upsert({
        where: { servico: item.servico },
        update: {
          label: item.label,
          valor: item.valor,
          unidade: item.unidade,
          ativo: item.ativo !== false,
          ordem: item.ordem ?? 0,
        },
        create: {
          servico: item.servico,
          label: item.label,
          valor: item.valor,
          unidade: item.unidade,
          ativo: item.ativo !== false,
          ordem: item.ordem ?? 0,
        },
      });
      results.push(updated);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json({ error: 'Erro ao atualizar preços' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await db.pricingConfig.create({
      data: {
        servico: body.servico,
        label: body.label,
        valor: body.valor,
        unidade: body.unidade,
        ativo: body.ativo !== false,
        ordem: body.ordem ?? 99,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing:', error);
    return NextResponse.json({ error: 'Erro ao criar preço' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { servico } = await request.json();
    await db.pricingConfig.delete({ where: { servico } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing:', error);
    return NextResponse.json({ error: 'Erro ao deletar preço' }, { status: 500 });
  }
}
