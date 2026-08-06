'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  User, Phone, Mail, MapPin, Users, Baby, Clock, ChefHat,
  Apple, AlertTriangle, ShoppingCart, Snowflake, MessageSquare,
  ArrowRight, ArrowLeft, Send, Sparkles
} from 'lucide-react';
import type { DiagnosticFormData } from '@/lib/types';

interface DiagnosticFormProps {
  onSubmit: (data: DiagnosticFormData) => void;
  isGenerating: boolean;
}

const INDICACOES = ['Redes Sociais', 'Get Ninjas', 'Google Pesquisa', 'Indicação de amigo'];
const SERVICOS_OPTIONS = [
  { label: 'Refeições para a semana', value: 'Refeições para a semana' },
  { label: 'Refeições para 15 dias', value: 'Refeições para 15 dias' },
  { label: 'Organização da cozinha', value: 'Organização da cozinha' },
  { label: 'Planejamento de cardápio', value: 'Planejamento de cardápio' },
  { label: 'Compras assistidas', value: 'Compras assistidas' },
  { label: 'Evento em casa', value: 'Evento em casa' },
];
const ESTILOS = ['Tradicional', 'Saudável', 'Fitness', 'Vegetariana', 'Vegana', 'Low Carb', 'Infantil'];

const initialForm: DiagnosticFormData = {
  nome: '',
  whatsapp: '',
  email: '',
  bairro: '',
  indicacao: '',
  moradores: 3,
  criancas: false,
  idosos: false,
  animais: false,
  servicos: ['Refeições para a semana'],
  dias: 7,
  estilo: 'Saudável',
  temRestricoes: false,
  temAlergias: false,
  detalhesRestricoes: '',
  preferencias: '',
  rejeicoes: '',
  temFreezer: true,
  freezerTamanho: 'Médio',
  compras: 'Eu',
  periodo: 'Qualquer horário',
  entrega: 'WhatsApp',
  observacoes: '',
};

export default function DiagnosticForm({ onSubmit, isGenerating }: DiagnosticFormProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DiagnosticFormData>(initialForm);
  const { toast } = useToast();

  const update = (field: keyof DiagnosticFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleServico = (value: string) => {
    setForm(prev => ({
      ...prev,
      servicos: prev.servicos.includes(value)
        ? prev.servicos.filter(s => s !== value)
        : [...prev.servicos, value],
    }));
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.nome.trim()) { toast({ title: 'Informe o nome do cliente' }); return false; }
      if (!form.whatsapp.trim()) { toast({ title: 'Informe o WhatsApp' }); return false; }
      if (!form.bairro.trim()) { toast({ title: 'Informe o bairro' }); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 3));
  };

  const handleSubmit = () => {
    if (validateStep()) onSubmit(form);
  };

  const steps = [
    { title: 'Informações Gerais', icon: User, color: 'bg-primary' },
    { title: 'Família & Serviço', icon: Users, color: 'bg-olive' },
    { title: 'Restrições & Preferências', icon: Apple, color: 'bg-gold' },
    { title: 'Produção & Logística', icon: ChefHat, color: 'bg-sage' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Diagnóstico Culinário Familiar</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Novo Diagnóstico</h1>
        <p className="text-muted-foreground text-sm">Preencha os dados do cliente para gerar uma proposta personalizada</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                i === step
                  ? `${s.color} text-white shadow-md`
                  : i < step
                  ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < 3 && <div className={`w-4 sm:w-8 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Informações Gerais */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Informações de Contato</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><User className="w-4 h-4" /> Nome completo *</Label>
                <Input placeholder="Ex: Mariana Nascimento" value={form.nome} onChange={e => update('nome', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> WhatsApp *</Label>
                <Input placeholder="Ex: 11988640504" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> E-mail</Label>
                <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Bairro *</Label>
                <Input placeholder="Ex: Brooklin" value={form.bairro} onChange={e => update('bairro', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Como conheceu meu trabalho?</Label>
              <div className="flex flex-wrap gap-2">
                {INDICACOES.map(ind => (
                  <Badge
                    key={ind}
                    variant={form.indicacao === ind ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => update('indicacao', form.indicacao === ind ? '' : ind)}
                  >{ind}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Família & Serviço */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Sobre a Família e Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Quantas pessoas moram na residência?</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <Button
                    key={n}
                    variant={form.moradores === n ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => update('moradores', n)}
                    className="w-12"
                  >{n}</Button>
                ))}
                <Input
                  className="w-20"
                  type="number"
                  min={6}
                  placeholder="+5"
                  value={form.moradores > 5 ? form.moradores : ''}
                  onChange={e => update('moradores', parseInt(e.target.value) || 5)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.criancas} onCheckedChange={c => update('criancas', !!c)} />
                <Baby className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Há crianças?</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.idosos} onCheckedChange={c => update('idosos', !!c)} />
                <span className="text-sm">Há idosos?</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.animais} onCheckedChange={c => update('animais', !!c)} />
                <span className="text-sm">Há animais?</span>
              </label>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Qual serviço você procura?</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICOS_OPTIONS.map(s => (
                  <Badge
                    key={s.value}
                    variant={form.servicos.includes(s.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleServico(s.value)}
                  >{s.label}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias de refeição</Label>
                <Select value={String(form.dias)} onValueChange={v => update('dias', parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estilo de alimentação</Label>
                <Select value={form.estilo} onValueChange={v => update('estilo', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTILOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    <SelectItem value="Ainda não sei">Ainda não sei</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Restrições & Preferências */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Restrições e Preferências Alimentares</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Existe alguma restrição alimentar?</Label>
              <RadioGroup
                value={form.temRestricoes ? 'sim' : 'nao'}
                onValueChange={v => update('temRestricoes', v === 'sim')}
                className="flex gap-4"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="nao" /> Não
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="sim" /> Sim
                </label>
              </RadioGroup>
            </div>

            {form.temRestricoes && (
              <div className="space-y-3 pl-4 border-l-2 border-destructive/30">
                <div className="space-y-2">
                  <Label>Alguém possui alergias?</Label>
                  <RadioGroup
                    value={form.temAlergias ? 'sim' : 'nao'}
                    onValueChange={v => update('temAlergias', v === 'sim')}
                    className="flex gap-4"
                  >
                    <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="nao" /> Não</label>
                    <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="sim" /> Sim</label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Detalhes das restrições</Label>
                  <Textarea
                    placeholder="Descreva as restrições, alergias, intolerâncias..."
                    value={form.detalhesRestricoes}
                    onChange={e => update('detalhesRestricoes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Apple className="w-4 h-4" /> Quais alimentos não podem faltar?</Label>
              <Input
                placeholder="Ex: Arroz, feijão"
                value={form.preferencias}
                onChange={e => update('preferencias', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Existe algum alimento que vocês não gostam?</Label>
              <Input
                placeholder="Ex: Pimentão, quiabo"
                value={form.rejeicoes}
                onChange={e => update('rejeicoes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Produção & Logística */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Produção e Logística</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Snowflake className="w-4 h-4" /> Você possui freezer?</Label>
              <RadioGroup
                value={form.temFreezer ? 'sim' : 'nao'}
                onValueChange={v => update('temFreezer', v === 'sim')}
                className="flex gap-4"
              >
                <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="sim" /> Sim</label>
                <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="nao" /> Não</label>
              </RadioGroup>
            </div>

            {form.temFreezer && (
              <div className="space-y-2">
                <Label>Tamanho do freezer</Label>
                <div className="flex gap-2">
                  {['Pequeno', 'Médio', 'Grande'].map(t => (
                    <Button
                      key={t}
                      variant={form.freezerTamanho === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update('freezerTamanho', t)}
                    >{t}</Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Quem fará as compras?</Label>
              <div className="flex flex-wrap gap-2">
                {['Eu', 'Prefiro que a Chef faça', 'Ainda não decidi'].map(o => (
                  <Badge
                    key={o}
                    variant={form.compras === o ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => update('compras', o)}
                  >{o}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Período preferido</Label>
                <Select value={form.periodo} onValueChange={v => update('periodo', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Qualquer horário">Qualquer horário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Como receber proposta?</Label>
                <Select value={form.entrega} onValueChange={v => update('entrega', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações adicionais</Label>
              <Textarea
                placeholder="Informações extras para uma proposta mais adequada..."
                value={form.observacoes}
                onChange={e => update('observacoes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(s - 1, 0))}
          disabled={step === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        {step < 3 ? (
          <Button onClick={handleNext}>
            Próximo <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? (
              <><span className="animate-spin mr-2">⟳</span> Gerando proposta...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Gerar Proposta</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
