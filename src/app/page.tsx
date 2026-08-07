'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DiagnosticForm from '@/components/DiagnosticForm';
import ProposalViewer from '@/components/ProposalViewer';
import ClientHistory from '@/components/ClientHistory';
import GeneratingAnimation from '@/components/GeneratingAnimation';
import PricingSettings from '@/components/PricingSettings';
import { ChefHat, History, Plus, Settings } from 'lucide-react';
import type { AppView, DiagnosticFormData } from '@/lib/types';

export default function Home() {
  const [view, setView] = useState<AppView>('history');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalData, setProposalData] = useState<any>(null);
  const [currentClientId, setCurrentClientId] = useState<string>('');
  const [currentProposalId, setCurrentProposalId] = useState<string>('');
  const [currentClientName, setCurrentClientName] = useState('');
  const [currentClientBairro, setCurrentClientBairro] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmitForm = async (data: DiagnosticFormData) => {
    setIsGenerating(true);
    setView('generating');
    try {
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const client = await clientRes.json();
      if (!client.id) throw new Error('Erro ao criar cliente');

      setCurrentClientId(client.id);
      setCurrentClientName(client.nome);
      setCurrentClientBairro(client.bairro);

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Erro ao gerar proposta');

      setCurrentProposalId(genData.proposalId);
      setProposalData({ etapas: genData.etapas, precificacao: genData.precificacao });
      setView('proposal');
      toast({ title: 'Proposta gerada com sucesso!' });
    } catch (error: any) {
      toast({ title: error.message || 'Erro inesperado', variant: 'destructive' });
      setView('form');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (clientId: string) => {
    setIsGenerating(true);
    setView('generating');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const clientRes = await fetch(`/api/clients/${clientId}`);
      const client = await clientRes.json();

      setCurrentClientId(clientId);
      setCurrentClientName(client.nome);
      setCurrentClientBairro(client.bairro);
      setCurrentProposalId(data.proposalId);
      setProposalData({ etapas: data.etapas, precificacao: data.precificacao });
      setView('proposal');
      toast({ title: 'Proposta regenerada!' });
    } catch (error: any) {
      toast({ title: error.message || 'Erro', variant: 'destructive' });
      setView('history');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewProposal = async (clientId: string, proposalId: string) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}`);
      const data = await res.json();

      const clientRes = await fetch(`/api/clients/${clientId}`);
      const client = await clientRes.json();

      setCurrentClientId(clientId);
      setCurrentProposalId(proposalId);
      setCurrentClientName(client.nome);
      setCurrentClientBairro(client.bairro);
      setProposalData({ etapas: data.etapas, precificacao: data.precificacao });
      setView('proposal');
    } catch {
      toast({ title: 'Erro ao carregar proposta', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('history')}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Mesa Pronta</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Gerador de Propostas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
            {view === 'proposal' && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setView('history')}>
                <History className="w-3.5 h-3.5" /> Histórico
              </Button>
            )}
            {view !== 'form' && view !== 'generating' && (
              <Button size="sm" className="text-xs gap-1" onClick={() => setView('form')}>
                <Plus className="w-3.5 h-3.5" /> Novo
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:py-8">
        {view === 'history' && (
          <ClientHistory
            onNewClient={() => setView('form')}
            onViewProposal={handleViewProposal}
            onRegenerate={handleRegenerate}
          />
        )}

        {view === 'form' && (
          <DiagnosticForm onSubmit={handleSubmitForm} isGenerating={isGenerating} />
        )}

        {view === 'generating' && <GeneratingAnimation />}

        {view === 'proposal' && proposalData && (
          <ProposalViewer
            clientName={currentClientName}
            clientBairro={currentClientBairro}
            etapas={proposalData.etapas}
            precificacao={proposalData.precificacao}
            proposalId={currentProposalId}
            onBack={() => setView('history')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-4 text-center text-xs text-muted-foreground">
        <p>&copy; 2026 Mesa Pronta Gastronomia &middot; Sistema de Propostas Comerciais</p>
      </footer>

      {/* Pricing Settings Dialog */}
      <PricingSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
