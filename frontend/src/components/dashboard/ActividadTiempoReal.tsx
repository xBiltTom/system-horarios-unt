'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Activity } from 'lucide-react';

interface Evento {
  tipo: string;
  timestamp?: string;
  [key: string]: any;
}

export function ActividadTiempoReal({ eventos }: { eventos: Evento[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Actividad Reciente</CardTitle>
        <Activity className="w-5 h-5 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {eventos.length === 0 && (
            <div className="text-center py-6 text-gray-400 flex flex-col items-center">
              <Activity className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Sin actividad reciente</p>
            </div>
          )}
          {eventos.map((ev, idx) => (
            <div key={idx} className="text-sm pb-3 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-800">{ev.tipo}</span>
                <span className="text-xs text-gray-400 font-medium">
                  {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate" title={JSON.stringify(ev)}>
                {JSON.stringify(ev).replace(/[{""}]/g, '').slice(0, 80)}...
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}