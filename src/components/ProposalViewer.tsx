'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText, DollarSign, MessageCircle, ClipboardCheck,
  ChevronDown, ChevronUp, Copy, Check, ArrowLeft, Download, Send
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface EtapaData {
  etapa: number;
  titulo: string;
  conteudo: string;
}

interface PricingData {
  plano: string;
  sessoesPorMes: number;
  valorPorSessao: number;
  valorTotalMensal: number;
  valorPorRefeicao: number;
  totalRefeicoes: number;
  observacoes: string[];
}

interface ProposalViewerProps {
  clientName: string;
  clientBairro: string;
  etapas: EtapaData[];
  precificacao: PricingData | null;
  onBack: () => void;
}

const ETAPA_ICONS: Record<number, any> = {
  1: FileText,
  2: ClipboardCheck,
  3: FileText,
  4: FileText,
  5: FileText,
  6: ClipboardCheck,
  7: FileText,
  8: ClipboardCheck,
  9: MessageCircle,
  10: FileText,
};

const ETAPA_COLORS: Record<number, string> = {
  1: 'bg-primary text-white',
  2: 'bg-olive text-white',
  3: 'bg-destructive/80 text-white',
  4: 'bg-gold text-white',
  5: 'bg-primary/80 text-white',
  6: 'bg-sage text-white',
  7: 'bg-olive/80 text-white',
  8: 'bg-muted-foreground text-white',
  9: 'bg-green-600 text-white',
  10: 'bg-primary text-white',
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function ProposalViewer({
  clientName, clientBairro, etapas, precificacao, onBack
}: ProposalViewerProps) {
  const [expandedEtapa, setExpandedEtapa] = useState<number | null>(null);
  const [copiedEtapa, setCopiedEtapa] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('etapas');

  const copyToClipboard = async (text: string, etapaNum: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEtapa(etapaNum);
      setTimeout(() => setCopiedEtapa(null), 2000);
    } catch {
      // fallback
    }
  };

  const copyWhatsAppMessage = async () => {
    const whatsappEtapa = etapas.find(e => e.etapa === 9);
    if (whatsappEtapa) {
      const cleanText = whatsappEtapa.conteudo.replace(/[#*_~`]/g, '');
      await navigator.clipboard.writeText(cleanText);
      setCopiedEtapa(999);
      setTimeout(() => setCopiedEtapa(null), 2000);
    }
  };

  const buildFullText = (): string => {
    let text = `PROPOSTA MESA PRONTA GASTRONOMIA\nCliente: ${clientName} - ${clientBairro}\n${'='.repeat(50)}\n\n`;
    for (const e of etapas) {
      text += `## ${e.titulo}\n\n${e.conteudo.replace(/[#*_~`]/g, '')}\n\n---\n\n`;
    }
    if (precificacao) {
      text += `## PRECIFICAÇÃO\n\n`;
      text += `Plano: ${precificacao.plano}\n`;
      text += `Sessões por mês: ${precificacao.sessoesPorMes}\n`;
      text += `Valor por sessão: ${formatBRL(precificacao.valorPorSessao)}\n`;
      text += `Valor total mensal: ${formatBRL(precificacao.valorTotalMensal)}\n`;
      text += `Valor por refeição: ${formatBRL(precificacao.valorPorRefeicao)}\n`;
      text += `Total de refeições: ${precificacao.totalRefeicoes}\n`;
    }
    return text;
  };

  const downloadAsText = () => {
    const blob = new Blob([buildFullText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposta-${clientName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Proposta Comercial</h1>
              <p className="text-sm text-muted-foreground">{clientName} &middot; {clientBairro}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-auto sm:ml-0">
          <Button variant="outline" size="sm" onClick={downloadAsText}>
            <Download className="w-4 h-4 mr-1" /> Baixar
          </Button>
          <Button size="sm" onClick={copyWhatsAppMessage}>
            {copiedEtapa === 999 ? <Check className="w-4 h-4 mr-1" /> : <Send className="w-4 h-4 mr-1" />}
            {copiedEtapa === 999 ? 'Copiado!' : 'Copiar WhatsApp'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="etapas" className="gap-2">
            <FileText className="w-4 h-4" /> Proposta (10 Etapas)
          </TabsTrigger>
          <TabsTrigger value="precificacao" className="gap-2">
            <DollarSign className="w-4 h-4" /> Precificação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="etapas" className="space-y-3 mt-4">
          {etapas.map((etapa) => {
            const Icon = ETAPA_ICONS[etapa.etapa] || FileText;
            const isExpanded = expandedEtapa === etapa.etapa;
            return (
              <Card key={etapa.etapa} className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedEtapa(isExpanded ? null : etapa.etapa)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${ETAPA_COLORS[etapa.etapa]}`}>
                          {etapa.etapa}
                        </div>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <CardTitle className="text-sm sm:text-base font-semibold">{etapa.titulo}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(etapa.conteudo, etapa.etapa);
                          }}
                        >
                          {copiedEtapa === etapa.etapa
                            ? <Check className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </Button>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                      <ReactMarkdown>{etapa.conteudo}</ReactMarkdown>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="precificacao" className="mt-4">
          {precificacao ? (
            <div className="space-y-6">
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    {precificacao.plano}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor por Sessão</p>
                      <p className="text-2xl font-bold text-primary">{formatBRL(precificacao.valorPorSessao)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessões/Mês</p>
                      <p className="text-2xl font-bold">{precificacao.sessoesPorMes}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Mensal</p>
                      <p className="text-2xl font-bold text-primary">{formatBRL(precificacao.valorTotalMensal)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor/Refeição</p>
                      <p className="text-2xl font-bold">{formatBRL(precificacao.valorPorRefeicao)}</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de refeições no período</span>
                    <span className="font-semibold">{precificacao.totalRefeicoes} refeições</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Observações sobre a precificação</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {precificacao.observacoes.map((obs, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {obs}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Precificação não disponível para esta proposta.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
