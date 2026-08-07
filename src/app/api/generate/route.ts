import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = `Você é o Consultor Comercial Oficial da Mesa Pronta Gastronomia. Personal Chef com mais de 20 anos de experiência prática em Gastronomia Residencial, Planejamento Alimentar e Meal Prep.

Seu tom: acolhedor, profissional, seguro, próximo sem ser informal. Você NUNCA soa como vendedor. Sua linguagem é a de uma chef que já conhece a família.

A Mesa Pronta NÃO vende comida — implanta um SISTEMA ALIMENTAR dentro da casa do cliente.

Regras absolutas:
- NUNCA entregue resposta genérica. Analise, cruze informações, faça inferências.
- NUNCA invente restrições que o cliente não informou.
- NUNCA repita receitas dentro da mesma proposta.
- SEMPRE pense em congelamento, reaproveitamento inteligente, praticidade e rotina real.
- SEMPRE explique suas decisões.
- O cliente deve terminar a leitura pensando: "Essa proposta foi feita especificamente para mim."

Faixa de preço de mercado para Personal Chef em São Paulo:
- Meal Prep semanal: R$ 500 a R$ 900 por sessão
- Por refeição individual: R$ 25 a R$ 45
- O preço deve considerar: número de moradores, dias de refeição, complexidade do cardápio, capacidade do freezer, se a chef precisa fazer compras

Você deve gerar a proposta completa seguindo o fluxo de 10 etapas abaixo. Cada etapa deve ser um objeto JSON com "titulo" e "conteudo" (texto rico em markdown).

ETAPA 1 — RESUMO EXECUTIVO: Quem é o cliente, perfil, problemas a resolver, oportunidades. Máximo 1 parágrafo.

ETAPA 2 — DIAGNÓSTICO: Identificar e justificar: rotina alimentar, necessidade de organização, nível de complexidade, possíveis dificuldades, perfil da produção, logística, equipamentos.

ETAPA 3 — ANÁLISE DE RESTRIÇÕES: Alergias, intolerâncias, preferências, rejeições, estilo alimentar, condições especiais (idosos, crianças, gestantes, etc.). Sempre adaptar o cardápio.

ETAPA 4 — SUGESTÕES DE CARDÁPIO: NUNCA entregar apenas 7 pratos. Múltiplas opções por categoria. Categorias obrigatórias: Carnes Bovinas, Frangos, Peixes, Suínos, Massas, Vegetarianos, Sopas, Acompanhamentos, Legumes, Purês, Arroz, Feijões, Sobremesas (quando fizer sentido). Evitar repetição de ingredientes. Priorizar pratos que congelam bem.

ETAPA 5 — JUSTIFICATIVA DO CARDÁPIO: Explicar por que cada escolha faz sentido para aquele cliente. Argumentar.

ETAPA 6 — AVALIAÇÃO DE PRODUÇÃO: Complexidade, tempo estimado, quantidade de preparações, necessidade de organização, observações práticas.

ETAPA 7 — OPORTUNIDADES ADICIONAIS: Organização do freezer/despensa, etiquetas, lista de compras, planejamento mensal, compras assistidas, evento futuro, cardápio infantil/para idosos.

ETAPA 8 — PONTOS A CONFIRMAR: Lista objetiva com checkboxes: tamanho do freezer, panela grande, elevador/acesso, estacionamento, horário preferido, responsável pelas compras, etc.

ETAPA 9 — MENSAGEM PARA WHATSAPP: Tom acolhedor, profissional, humano. NUNCA soar como vendedor. Linguagem próxima, como uma chef que já conhece a família. NÃO inclua valores nem precificação nesta mensagem — a proposta comercial com valores será enviada em anexo. Inclua obrigatoriamente as informações de pagamento: "Pagamento via PIX na entrega do serviço." e, quando as compras forem feitas pela chef, inclua: "Os valores das compras são restituídos mediante apresentação de nota fiscal." Escreva de forma profissional e elegante.

ETAPA 10 — PROPOSTA COMERCIAL FINAL: Estrutura obrigatória: 1. Apresentação, 2. Resumo do diagnóstico, 3. Como funciona o serviço, 4. Cardápio sugerido, 5. CONDIÇÕES DE PAGAMENTO (pagamento via PIX na entrega do serviço; para compras feitas pela chef, restituição mediante apresentação de nota fiscal), 6. Próximos passos, 7. Observações. A seção de CONDIÇÕES DE PAGAMENTO é OBRIGATÓRIA e deve vir logo após o cardápio. NÃO inclua tabela de preços, valores nem seção de investimento nesta etapa — a precificação fica no documento anexo.

Para a PRECIFICAÇÃO, gere um objeto JSON separado com:
- plano: nome do plano sugerido (ex: "Plano Semanal Completo")
- sessoesPorMes: número de sessões mensais (geralmente 2 para 7 dias, 4 para 15 dias, etc.)
- valorPorSessao: valor por sessão (entre R$500 e R$900)
- valorTotalMensal: sessoesPorMes * valorPorSessao
- valorPorRefeicao: valorTotalMensal / totalRefeicoes (deve ficar entre R$25 e R$45)
- totalRefeicoes: calcular com base nos moradores e dias
- observacoes: array de 3-5 observações sobre a precificação

RESPONDA EXCLUSIVAMENTE EM JSON válido com esta estrutura exata:
{
  "etapas": [
    { "etapa": 1, "titulo": "...", "conteudo": "..." },
    { "etapa": 2, "titulo": "...", "conteudo": "..." },
    ...até a etapa 10
  ],
  "precificacao": {
    "plano": "...",
    "sessoesPorMes": 0,
    "valorPorSessao": 0,
    "valorTotalMensal": 0,
    "valorPorRefeicao": 0,
    "totalRefeicoes": 0,
    "observacoes": ["..."]
  }
}

IMPORTANTE: Todo o conteúdo deve ser em português brasileiro. Os textos devem ser ricos, detalhados e personalizados. NUNCA use linguagem técnica em excesso.`;

function buildClientPrompt(client: any): string {
  const restricoes = client.restricoes ? JSON.parse(client.restricoes) : { has: false, alergias: false, details: '' };
  const servicos = typeof client.servico === 'string' ? JSON.parse(client.servico) : client.servico;

  return `
DADOS DO CLIENTE — DIAGNÓSTICO CULINÁRIO FAMILIAR:

Nome: ${client.nome}
WhatsApp: ${client.whatsapp}
E-mail: ${client.email || 'Não informado'}
Bairro: ${client.bairro}
Como conheceu: ${client.indicacao || 'Não informado'}

--- SOBRE A FAMÍLIA ---
Número de moradores: ${client.moradores}
Há crianças? ${client.criancas ? 'Sim' : 'Não'}
Há idosos? ${client.idosos ? 'Sim' : 'Não'}
Há animais? ${client.animais ? 'Sim' : 'Não'}

--- SERVIÇO ---
Serviços desejados: ${Array.isArray(servicos) ? servicos.join(', ') : servicos}
Dias de refeição: ${client.dias}
Estilo alimentar: ${client.estilo}

--- RESTRIÇÕES ---
Possui restrições alimentares? ${restricoes.has ? 'Sim' : 'Não'}
Possui alergias? ${restricoes.alergias ? 'Sim' : 'Não'}
Detalhes das restrições: ${restricoes.details || 'Nenhuma'}

--- PREFERÊNCIAS ---
Alimentos que não podem faltar: ${client.preferencias || 'Não informado'}
Alimentos que não gostam: ${client.rejeicoes || 'Nenhum'}

--- PRODUÇÃO ---
Possui freezer? ${client.freezer !== 'Nao' ? 'Sim' : 'Não'}
Tamanho do freezer: ${client.freezer}
Quem faz as compras: ${client.compras}
Período preferido: ${client.periodo}
Como receber proposta: ${client.entrega}

--- OBSERVAÇÕES ---
${client.observacoes || 'Nenhuma observação adicional'}
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, valorPorSessao, sessoesPorMes } = await request.json();

    // Fetch client data
    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    const userPrompt = buildClientPrompt(client);

    // Add manual pricing if provided by the user, or from last proposal
    let vSessao = valorPorSessao || null;
    let sMes = sessoesPorMes || null;
    if (!vSessao || !sMes) {
      const lastProposal = await db.proposal.findFirst({
        where: { clientId },
        orderBy: { criadoEm: 'desc' },
      });
      if (lastProposal?.precificacao) {
        try {
          const lastPricing = JSON.parse(lastProposal.precificacao);
          vSessao = vSessao || lastPricing.valorPorSessao || null;
          sMes = sMes || lastPricing.sessoesPorMes || null;
        } catch { /* */ }
      }
    }
    let manualPricingContext = '';
    if (vSessao && sMes) {
      manualPricingContext = `

--- PRECIFICAÇÃO DEFINIDA PELA CHEF (USE EXATAMENTE ESTES VALORES) ---
Valor por sessão: R$ ${Number(vSessao).toFixed(2)}
Sessões por mês: ${Number(sMes)}
Valor total mensal: R$ ${(Number(vSessao) * Number(sMes)).toFixed(2)}
Total de refeições: calcular com base em ${client.moradores} moradores × ${client.dias} dias
Valor por refeição: calcular (total mensal / total refeições)

ATENÇÃO: Use EXATAMENTE R$ ${Number(vSessao).toFixed(2)} por sessão e ${Number(sMes)} sessões por mês. NÃO altere esses valores.
NÃO inclua esses valores na ETAPA 10 (Proposta Comercial Final) — a precificação vai apenas no objeto JSON separado e no documento anexo.
Na ETAPA 10, inclua apenas as condições de pagamento: PIX na entrega do serviço e restituição de compras com nota fiscal.`;
    }

    // Fetch custom pricing config
    let pricingContext = '';
    try {
      const pricingRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pricing`);
      const pricingData = await pricingRes.json();
      const activePricing = pricingData.filter((p: any) => p.ativo);
      if (activePricing.length > 0) {
        pricingContext = `

--- TABELA DE PREÇOS DA CHEF (USE ESTES VALORES COMO REFERÊNCIA) ---
${activePricing.map((p: any) => `- ${p.label}: R$ ${p.valor.toFixed(2)} por ${p.unidade}`).join('\n')}
Regra: o valor por sessão na precificação deve estar dentro da faixa definida acima. Calcule o valor por refeição dividindo o total mensal pelo total de refeições.
`;
      }
    } catch (e) {
      console.log('Could not fetch pricing config, using defaults');
    }

    // Call LLM to generate proposal
    const result = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt + manualPricingContext + pricingContext },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const responseText = result.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    let proposalData: any;
    try {
      // Try direct parse first
      proposalData = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        proposalData = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object
        const objMatch = responseText.match(/\{[\s\S]*\}/);
        if (objMatch) {
          proposalData = JSON.parse(objMatch[0]);
        } else {
          throw new Error('Não foi possível extrair JSON da resposta');
        }
      }
    }

    // Save proposal to database
    const etapas = proposalData.etapas || [];
    const etapaData: Record<string, string> = {};
    for (const etapa of etapas) {
      etapaData[`etapa${etapa.etapa}`] = JSON.stringify({
        titulo: etapa.titulo,
        conteudo: etapa.conteudo,
      });
    }

    const precificacao = proposalData.precificacao
      ? JSON.stringify(proposalData.precificacao)
      : null;

    // Update existing draft or create new
    const existingDraft = await db.proposal.findFirst({
      where: { clientId, status: 'rascunho' },
    });

    let proposal;
    if (existingDraft) {
      proposal = await db.proposal.update({
        where: { id: existingDraft.id },
        data: {
          ...etapaData,
          precificacao,
          status: 'gerada',
        },
      });
    } else {
      proposal = await db.proposal.create({
        data: {
          clientId,
          ...etapaData,
          precificacao,
          status: 'gerada',
        },
      });
    }

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      etapas,
      precificacao: proposalData.precificacao,
    });
  } catch (error: any) {
    console.error('Error generating proposal:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar proposta: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
