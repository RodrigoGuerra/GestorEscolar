import Card from '../components/ui/Card';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

const mockNotifications = [
  { id: 1, title: 'Balanço mensal disponível', message: 'O relatório financeiro de Fevereiro já pode ser consultado.', type: 'info', time: '2 horas atrás' },
  { id: 2, title: 'Inadimplência detectada', message: 'Existem 5 faturas vencidas que precisam de atenção.', type: 'warning', time: '5 horas atrás' },
  { id: 3, title: 'Ponto eletrônico regularizado', message: 'Todos os colaboradores bateram ponto hoje.', type: 'success', time: '1 dia atrás' },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Notificações</h2>
        <p className="text-text-secondary mt-1">Fique por dentro das atualizações do sistema.</p>
      </div>

      <div className="max-w-3xl space-y-4">
        {mockNotifications.map((n) => (
          <Card key={n.id} className="bg-surface border-border p-5 flex gap-4 hover:border-white/20 transition-colors">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              n.type === 'info' ? 'bg-primary/10 text-primary' : 
              n.type === 'warning' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
            }`}>
              {n.type === 'info' ? <Info size={20} /> : 
               n.type === 'warning' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-white">{n.title}</h4>
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-tighter">{n.time}</span>
              </div>
              <p className="text-sm text-text-secondary mt-1">{n.message}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
