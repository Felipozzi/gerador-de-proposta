// Form fields matching Google Forms diagnostic
export interface DiagnosticFormData {
  // Informações Gerais
  nome: string;
  whatsapp: string;
  email: string;
  bairro: string;
  indicacao: string;
  moradores: number;
  criancas: boolean;
  idosos: boolean;
  animais: boolean;

  // Serviço
  servicos: string[];
  dias: number;
  estilo: string;

  // Restrições
  temRestricoes: boolean;
  temAlergias: boolean;
  detalhesRestricoes: string;
  preferencias: string;
  rejeicoes: string;

  // Produção
  temFreezer: boolean;
  freezerTamanho: string;
  compras: string;
  periodo: string;
  entrega: string;
  observacoes: string;

  // Precificação manual (opcional — se preenchido, a IA usa esses valores)
  valorPorSessao: number | null;
  sessoesPorMes: number | null;
}

export interface ClientData {
  id: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  bairro: string;
  indicacao: string | null;
  moradores: number;
  criancas: boolean;
  idosos: boolean;
  animais: boolean | null;
  servico: string;
  dias: number;
  estilo: string;
  restricoes: string | null;
  preferencias: string | null;
  rejeicoes: string | null;
  freezer: string;
  compras: string;
  periodo: string;
  entrega: string;
  observacoes: string | null;
  criadoEm: string;
}

export interface ProposalData {
  id: string;
  clientId: string;
  client?: ClientData;
  etapa1: string | null;
  etapa2: string | null;
  etapa3: string | null;
  etapa4: string | null;
  etapa5: string | null;
  etapa6: string | null;
  etapa7: string | null;
  etapa8: string | null;
  etapa9: string | null;
  etapa10: string | null;
  precificacao: string | null;
  status: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PricingBreakdown {
  sessoesPorMes: number;
  valorPorSessao: number;
  valorTotalMensal: number;
  valorPorRefeicao: number;
  totalRefeicoes: number;
  plano: string;
  observacoes: string[];
}

export type AppView = 'form' | 'generating' | 'proposal' | 'history' | 'client-detail';
