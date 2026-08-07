'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Settings, DollarSign, Plus, Trash2, Save, GripVertical,
  ChefHat, CalendarDays, Home, ClipboardList, ShoppingCart, PartyPopper, Sparkles
} from 'lucide-react';

interface PricingItem {
  id: string;
  servico: string;
  label: string;
  valor: number;
  unidade: string;
  ativo: boolean;
  ordem: number;
}

const ICONS: Record<string, any> = {
  'Meal Prep': ChefHat,
  'Organização': Home,
  'Planejamento': ClipboardList,
  'Compras': ShoppingCart,
  'Evento': PartyPopper,
};

function getIcon(label: string) {
  for (const [key, Icon] of Object.entries(ICONS)) {
    if (label.includes(key)) return Icon;
  }
  return Sparkles;
}

interface PricingSettingsProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

export default function PricingSettings({ open, onOpenChange }: PricingSettingsProps) {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [original, setOriginal] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValor, setNewValor] = useState('');
  const [newUnidade, setNewUnidade] = useState('sessão');
  const { toast } = useToast();

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pricing');
      const data = await res.json();
      setItems(data);
      setOriginal(data);
    } catch {
      toast({ title: 'Erro ao carregar preços', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) fetchPricing();
  }, [open, fetchPricing]);

  const updateItem = (servico: string, field: keyof PricingItem, value: any) => {
    setItems(prev => prev.map(item =>
      item.servico === servico ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    if (!newLabel.trim()) return;
    const key = newLabel
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      + '_' + Date.now();
    setItems(prev => [
      ...prev,
      {
        id: '',
        servico: key,
        label: newLabel.trim(),
        valor: parseFloat(newValor) || 0,
        unidade: newUnidade,
        ativo: true,
        ordem: prev.length + 1,
      },
    ]);
    setNewLabel('');
    setNewValor('');
    setNewUnidade('sessão');
  };

  const removeItem = (servico: string) => {
    setItems(prev => prev.filter(item => item.servico !== servico));
  };

  const hasChanges = JSON.stringify(items) !== JSON.stringify(original);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error();
      setOriginal(items);
      toast({ title: 'Preços salvos com sucesso!' });
    } catch {
      toast({ title: 'Erro ao salvar preços', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const activeItems = items.filter(i => i.ativo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Tabela de Preços dos Serviços
          </DialogTitle>
          <DialogDescription>
            Defina os valores dos seus serviços. Esses preços serão usados como referência pela IA ao gerar propostas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {/* Active Services */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Serviços cadastrados</p>
                <Badge variant="secondary" className="text-xs">
                  {activeItems.length} ativo{activeItems.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {items.map((item) => {
                const Icon = getIcon(item.label);
                return (
                  <Card key={item.servico} className={!item.ativo ? 'opacity-50' : ''}>
                    <CardContent className="p-3 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Input
                              value={item.label}
                              onChange={e => updateItem(item.servico, 'label', e.target.value)}
                              className="h-7 text-sm font-medium border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={item.ativo}
                            onCheckedChange={v => updateItem(item.servico, 'ativo', v)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(item.servico)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pl-10">
                        <div className="relative flex-1 max-w-[180px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={item.valor}
                            onChange={e => updateItem(item.servico, 'valor', parseFloat(e.target.value) || 0)}
                            className="pl-9 h-9 text-base font-semibold"
                            step={25}
                            min={0}
                          />
                        </div>
                        <div className="flex-1 max-w-[140px]">
                          <Input
                            value={item.unidade}
                            onChange={e => updateItem(item.servico, 'unidade', e.target.value)}
                            className="h-9 text-sm"
                            placeholder="sessão"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatBRL(item.valor)}/{item.unidade}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Add New Service */}
            <Separator />\n            <div className="space-y-3">
              <p className="text-sm font-medium">Adicionar serviço</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nome do serviço"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="flex-1 h-9"
                />
                <div className="relative w-full sm:w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newValor}
                    onChange={e => setNewValor(e.target.value)}
                    className="pl-9 h-9"
                    step={25}
                    min={0}
                  />
                </div>
                <Input
                  placeholder="Unidade"
                  value={newUnidade}
                  onChange={e => setNewUnidade(e.target.value)}
                  className="w-full sm:w-28 h-9"
                />
                <Button variant="outline" onClick={addItem} disabled={!newLabel.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Summary & Save */}
            {hasChanges && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Alterações não salvas</p>
                    <p className="text-xs text-muted-foreground">
                      {activeItems.length} serviço{activeItems.length !== 1 ? 's' : ''} ativo{activeItems.length !== 1 ? 's' : ''}
                      &middot; Valores de {formatBRL(Math.min(...activeItems.map(i => i.valor)))} a {formatBRL(Math.max(...activeItems.map(i => i.valor)))}
                    </p>
                  </div>
                  <Button onClick={save} disabled={saving}>
                    {saving ? 'Salvando...' : <><Save className="w-4 h-4 mr-1" /> Salvar</>}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
