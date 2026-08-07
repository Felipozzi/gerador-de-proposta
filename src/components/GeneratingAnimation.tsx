'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ChefHat, UtensilsCrossed, ClipboardList, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { icon: ClipboardList, label: 'Analisando diagnóstico...', delay: 0 },
  { icon: ChefHat, label: 'Criando cardápio personalizado...', delay: 0.2 },
  { icon: UtensilsCrossed, label: 'Avaliando produção e logística...', delay: 0.4 },
  { icon: Sparkles, label: 'Precificando serviço...', delay: 0.6 },
  { icon: CheckCircle2, label: 'Finalizando proposta...', delay: 0.8 },
];

export default function GeneratingAnimation() {
  return (
    <div className="w-full max-w-md mx-auto space-y-8 py-12">
      <div className="text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <Sparkles className="w-5 h-5 text-gold absolute -top-1 -right-1 animate-bounce" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Gerando proposta personalizada</h2>
          <p className="text-sm text-muted-foreground mt-1">A Chef Cris está analisando o diagnóstico e preparando tudo com carinho...</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 animate-pulse"
                style={{
                  animationDelay: `${step.delay}s`,
                  animationDuration: '2s',
                  opacity: 0.4 + (i * 0.15),
                }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{step.label}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Isso geralmente leva de 30 a 60 segundos
      </p>
    </div>
  );
}
