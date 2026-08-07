'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Search, Plus, Trash2, FileText, Clock, MapPin, Phone,
  ChevronRight, Sparkles, RotateCcw, UserCheck
} from 'lucide-react';
import type { ClientData, ProposalData } from '@/lib/types';

interface ClientHistoryProps {
  onNewClient: () => void;
  onViewProposal: (clientId: string, proposalId: string) => void;
  onRegenerate: (clientId: string) => void;
}

export default function ClientHistory({ onNewClient, onViewProposal, onRegenerate }: ClientHistoryProps) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<(ClientData & { propostas: ProposalData[] }) | null>(null);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch {
      toast({ title: 'Erro ao carregar clientes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const deleteClient = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/clients/${deleteId}`, { method: 'DELETE' });
      setClients(c => c.filter(cl => cl.id !== deleteId));
      toast({ title: 'Cliente removido' });
    } catch {
      toast({ title: 'Erro ao remover cliente' });
    }
    setDeleteId(null);
  };

  const fetchClientDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      setSelectedClient(data);
    } catch {
      toast({ title: 'Erro ao buscar detalhes' });
    }
  };

  const filtered = clients.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.bairro.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    rascunho: 'bg-gray-100 text-gray-700',
    gerada: 'bg-green-100 text-green-800',
    enviada: 'bg-blue-100 text-blue-800',
  };

  const statusLabels: Record<string, string> = {
    rascunho: 'Rascunho',
    gerada: 'Gerada',
    enviada: 'Enviada',
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Histórico de diagnósticos e propostas geradas</p>
        </div>
        <Button onClick={onNewClient}>
          <Plus className="w-4 h-4 mr-2" /> Novo Diagnóstico
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou bairro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <div>
              <p className="font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm text-muted-foreground">
                {search ? 'Tente outra busca' : 'Comece preenchendo um novo diagnóstico'}
              </p>
            </div>
            {!search && (
              <Button variant="outline" onClick={onNewClient}>
                <Plus className="w-4 h-4 mr-2" /> Criar primeiro diagnóstico
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((client) => {
            const propostasCount = (client as any)._count?.propostas || 0;
            return (
              <Card key={client.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => fetchClientDetail(client.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{client.nome}</h3>
                        {propostasCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />{propostasCount} proposta{propostasCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{client.bairro}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{client.moradores} moradores</span>
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.whatsapp}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(client.criadoEm).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline" className="text-xs">{client.estilo}</Badge>
                        <Badge variant="outline" className="text-xs">{client.dias} dias</Badge>
                        {client.criancas && <Badge variant="outline" className="text-xs">Crianças</Badge>}
                        {client.idosos && <Badge variant="outline" className="text-xs">Idosos</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {propostasCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => onRegenerate(client.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Regenerar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(client.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={o => !o && setSelectedClient(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedClient?.nome}</DialogTitle>
            <DialogDescription>{selectedClient?.bairro} &middot; {selectedClient?.whatsapp}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            {selectedClient?.propostas && selectedClient.propostas.length > 0 ? (
              <div className="space-y-2 pt-2">
                {selectedClient.propostas.map((p: ProposalData) => (
                  <Card
                    key={p.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => {
                      if (p.status !== 'rascunho') {
                        onViewProposal(selectedClient.id, p.id);
                      }
                      setSelectedClient(null);
                    }}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Proposta #{p.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[p.status] || ''}>{statusLabels[p.status] || p.status}</Badge>
                        {p.status !== 'rascunho' && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma proposta gerada ainda</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    onRegenerate(selectedClient!.id);
                    setSelectedClient(null);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-1" /> Gerar proposta
                </Button>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover o cliente e todas as propostas associadas. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteClient} className="bg-destructive text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
