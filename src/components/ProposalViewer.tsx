'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, DollarSign, MessageCircle, ClipboardCheck,
  ChevronDown, ChevronUp, Copy, Check, ArrowLeft, Download, Send,
  Save, RotateCcw, Pencil, Eye
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
  proposalId: string;
  onBack: () => void;
}

const ETAPA_ICONS: Record<number, any> = {
  1: FileText, 2: ClipboardCheck, 3: FileText, 4: FileText, 5: FileText,
  6: ClipboardCheck, 7: FileText, 8: ClipboardCheck, 9: MessageCircle, 10: FileText,
};

const ETAPA_COLORS: Record<number, string> = {
  1: 'bg-primary text-white', 2: 'bg-olive text-white', 3: 'bg-destructive/80 text-white',
  4: 'bg-gold text-white', 5: 'bg-primary/80 text-white', 6: 'bg-sage text-white',
  7: 'bg-olive/80 text-white', 8: 'bg-muted-foreground text-white',
  9: 'bg-green-600 text-white', 10: 'bg-primary text-white',
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseBRL(value: string): number {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

export default function ProposalViewer({
  clientName, clientBairro, etapas, precificacao, proposalId, onBack
}: ProposalViewerProps) {
  const [expandedEtapa, setExpandedEtapa] = useState<number | null>(null);
  const [copiedEtapa, setCopiedEtapa] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('etapas');
  const [editing, setEditing] = useState(false);
  const [pricing, setPricing] = useState<PricingData | null>(precificacao);
  const [obsText, setObsText] = useState('');
  const [planoName, setPlanoName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (precificacao) {
      setPricing({ ...precificacao });
      setObsText(precificacao.observacoes?.join('\n') || '');
      setPlanoName(precificacao.plano || '');
    }
  }, [precificacao]);

  // Auto-calculate derived fields
  const recalc = (field: string, value: any) => {
    if (!pricing) return;
    const updated = { ...pricing, [field]: value };

    if (field === 'valorPorSessao' || field === 'sessoesPorMes') {
      updated.valorTotalMensal = (field === 'valorPorSessao' ? value : updated.valorPorSessao) * (field === 'sessoesPorMes' ? value : updated.sessoesPorMes);
    }
    if (updated.valorTotalMensal && updated.totalRefeicoes) {
      updated.valorPorRefeicao = Math.round((updated.valorTotalMensal / updated.totalRefeicoes) * 100) / 100;
    }
    setPricing(updated);
  };

  const savePricing = async () => {
    if (!pricing || !proposalId) return;
    setSaving(true);
    try {
      const finalPricing = {
        ...pricing,
        plano: planoName || pricing.plano,
        observacoes: obsText.split('\n').filter(l => l.trim()),
      };
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precificacao: JSON.stringify(finalPricing) }),
      });
      if (!res.ok) throw new Error();
      setPricing(finalPricing);
      setEditing(false);
      toast({ title: 'Precificação atualizada!' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string, etapaNum: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEtapa(etapaNum);
      setTimeout(() => setCopiedEtapa(null), 2000);
    } catch { /* */ }
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
    if (pricing) {
      text += `## PRECIFICAÇÃO\n\n`;
      text += `Plano: ${pricing.plano}\n`;
      text += `Sessões por mês: ${pricing.sessoesPorMes}\n`;
      text += `Valor por sessão: ${formatBRL(pricing.valorPorSessao)}\n`;
      text += `Valor total mensal: ${formatBRL(pricing.valorTotalMensal)}\n`;
      text += `Valor por refeição: ${formatBRL(pricing.valorPorRefeicao)}\n`;
      text += `Total de refeições: ${pricing.totalRefeicoes}\n`;
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

  const showPricing = !!pricing;

  const hasChanges = JSON.stringify({ ...pricing, plano: planoName, observacoes: obsText.split('\n').filter(l => l.trim()) }) !== JSON.stringify(precificacao);

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

        {/* ESTRUTURA ETAPAS - sem alterações */}
        <TabsContent value="etapas" className="space-y-3 mt-4">
          {etapas.map((etapa, idx) => {
            const Icon = ETAPA_ICONS[etapa.etapa] || FileText;
            const isExpanded = expandedEtapa === etapa.etapa;
            return (
              <Card key={`etapa-${etapa.etapa}-${idx}`} className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
                <button className="w-full text-left" onClick={() => setExpandedEtapa(isExpanded ? null : etapa.etapa)}>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(etapa.conteudo, etapa.etapa); }}>
                          {copiedEtapa === etapa.etapa
                            ? <Check className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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

        {/* PRECIFICAÇÃO - AGORA EDITÁVEL */}
        <TabsContent value="precificacao" className="mt-4">
          {showPricing && pricing ? (
            <div className="space-y-6">
              {/* Toggle Edit */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => { if (editing) { setPricing(precificacao); setObsText(precificacao.observacoes?.join('\n') || ''); setPlanoName(precificacao.plano || ''); } setEditing(!editing); }}>
                  {editing ? <><RotateCcw className="w-3.5 h-3.5 mr-1" /> Desfazer</> : <><Pencil className="w-3.5 h-3.5 mr-1" /> Editar Preços</>}
                </Button>
              </div>

              {/* Main Pricing Card */}
              <Card className={`border-2 ${editing ? 'border-primary/40 bg-primary/5' : 'border-primary/20 bg-primary/5'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    {editing ? (
                      <Input
                        value={planoName || pricing.plano}
                        onChange={e => setPlanoName(e.target.value)}
                        className="h-9 text-lg font-bold max-w-sm"
                      />
                    ) : (
                      pricing.plano
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Valor por Sessão */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Valor por Sessão</Label>
                      {editing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                          <Input type="number" value={pricing.valorPorSessao} onChange={e => recalc('valorPorSessao', parseFloat(e.target.value) || 0)} className="pl-9 text-xl font-bold" step={25} min={0} />
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-primary">{formatBRL(pricing.valorPorSessao)}</p>
                      )}
                    </div>

                    {/* Sessões por Mês */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Sessões/Mês</Label>
                      {editing ? (
                        <Input type="number" value={pricing.sessoesPorMes} onChange={e => recalc('sessoesPorMes', parseInt(e.target.value) || 0)} className="text-xl font-bold w-24" min={1} />
                      ) : (
                        <p className="text-2xl font-bold">{pricing.sessoesPorMes}</p>
                      )}
                    </div>

                    {/* Total Mensal */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Mensal</Label>
                      {editing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
                          <Input type="number" value={pricing.valorTotalMensal} onChange={e => recalc('valorTotalMensal', parseFloat(e.target.value) || 0)} className="pl-9 text-xl font-bold" step={25} min={0} />
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-primary">{formatBRL(pricing.valorTotalMensal)}</p>
                      )}
                    </div>

                    {/* Valor/Refeição */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Valor/Refeição</Label>
                      <p className="text-2xl font-bold">{formatBRL(pricing.valorPorRefeicao)}</p>
                      <p className="text-[10px] text-muted-foreground">calculado automaticamente</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de refeições no período</span>
                    {editing ? (
                      <Input type="number" value={pricing.totalRefeicoes} onChange={e => recalc('totalRefeicoes', parseInt(e.target.value) || 0)} className="w-24 h-8 text-right text-sm" min={1} />
                    ) : (
                      <span className="font-semibold">{pricing.totalRefeicoes} refeições</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    Observações sobre a precificação
                    {editing && <Eye className="w-4 h-4 text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea
                      value={obsText}
                      onChange={e => setObsText(e.target.value)}
                      rows={5}
                      placeholder="Uma observação por linha..."
                      className="text-sm"
                    />
                  ) : (
                    <ul className="space-y-2">
                      {pricing.observacoes?.map((obs, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          {obs}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              {editing && hasChanges && (
                <div className="flex justify-end">
                  <Button onClick={savePricing} disabled={saving}>
                    {saving ? 'Salvando...' : <><Save className="w-4 h-4 mr-1" /> Salvar Alterações</>}
                  </Button>
                </div>
              )}
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