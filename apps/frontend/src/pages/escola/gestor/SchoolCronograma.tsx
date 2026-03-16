import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { Calendar as CalendarIcon, Loader2, Clock } from 'lucide-react';

const SchoolCronograma: React.FC = () => {
  const { id } = useParams();
  
  // Here we would typically fetch schedules/events for the given school ID
  const loading = false;
  const error = null;

  // Mock data for the demonstration as per dashboard needs
  const scheduleEvents = [
    { id: 1, title: 'Reunião de Pais e Mestres', date: '2026-03-20T18:00', type: 'EVENT' },
    { id: 2, title: 'Início do 2º Bimestre', date: '2026-04-15T08:00', type: 'ACADEMIC' },
    { id: 3, title: 'Conselho de Classe', date: '2026-04-10T14:00', type: 'MEETING' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Cronograma</h3>
          <p className="text-text-muted">Eventos e Calendário Acadêmico desta unidade</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <Card className="bg-surface border-border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CalendarIcon size={24} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">Próximos Eventos</p>
              <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Mês Atual</h4>
            </div>
          </div>

          <div className="space-y-4">
            {scheduleEvents.length > 0 ? (
              scheduleEvents.map(event => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${
                    event.type === 'EVENT' ? 'bg-primary/20 text-primary' :
                    event.type === 'ACADEMIC' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">{event.title}</h5>
                    <p className="text-xs text-text-muted font-mono">{new Date(event.date).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted italic bg-surface/50 border border-border rounded-xl">
                Nenhum evento agendado para unit {id}.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SchoolCronograma;
